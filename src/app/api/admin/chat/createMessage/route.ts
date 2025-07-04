import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq, or } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	chatMessagesWithConversation,
	conversations,
} from '~/server/db/schema';

interface ChatRequestBody {
	receiverId?: string;
	message: string;
	conversationId?: number;
}

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as ChatRequestBody;
		const { receiverId, message, conversationId: clientConversationId } = body;

		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
		}

		let conversationId: number;

		if (clientConversationId) {
			conversationId = clientConversationId;
		} else {
			if (!receiverId || receiverId === 'new') {
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

		const typedReq = req as NextRequest & {
			socket?: {
				server?: {
					io?: {
						emit: (event: string, payload: unknown) => void;
					};
				};
			};
		};

		const io = typedReq.socket?.server?.io;
		if (io && receiverId && receiverId !== userId) {
			io.emit('notification', {
				type: 'new_message',
				from: userId,
				receiverId,
				message,
				conversationId,
			});
		}

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
