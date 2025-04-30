import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';
import {
	conversations,
	chatMessagesWithConversation,
} from '~/server/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
		}

		const {
			receiverId,
			message,
			conversationId: clientConversationId,
		} = await req.json();

		let conversationId = clientConversationId;

		// Solo si no nos mandaron conversationId, intentamos buscar o crear una
		if (!conversationId) {
			if (!receiverId || receiverId === 'new') {
				// Chat consigo mismo
				const result = await db
					.insert(conversations)
					.values({
						senderId: userId,
						receiverId: userId,
						status: 'activo',
					})
					.returning();
				conversationId = result[0].id;
			} else {
				// Verificar si ya existe conversación entre user y receiver
				const existing = await db
					.select()
					.from(conversations)
					.where(
						and(
							eq(conversations.status, 'activo'),
							or(
								and(
									eq(conversations.senderId, userId),
									eq(conversations.receiverId, receiverId)
								),
								and(
									eq(conversations.senderId, receiverId),
									eq(conversations.receiverId, userId)
								)
							)
						)
					);

				if (existing.length > 0) {
					conversationId = existing[0].id;
				} else {
					const result = await db
						.insert(conversations)
						.values({
							senderId: userId,
							receiverId,
							status: 'activo',
						})
						.returning();
					conversationId = result[0].id;
				}
			}
		}

		// Emitir notificación por socket si aplica
		const io = (req as any)?.socket?.server?.io;
		if (io && receiverId && receiverId !== userId) {
			io.emit('notification', {
				type: 'new_message',
				from: userId,
				receiverId,
				message,
				conversationId,
			});
		}

		// Guardar mensaje
		const newMessage = await db
			.insert(chatMessagesWithConversation)
			.values({
				conversationId,
				senderId: userId,
				message,
			})
			.returning();

		return NextResponse.json({
			success: true,
			conversationId,
			messageId: newMessage[0].id,
			receiverId,
		});
	} catch (error) {
		console.error('Error creating message:', error);
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
