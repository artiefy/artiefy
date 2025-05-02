import { type NextRequest, NextResponse } from 'next/server';

import { eq, asc } from 'drizzle-orm';

import { db } from '~/server/db';
import { chatMessagesWithConversation, users } from '~/server/db/schema';

export async function GET(
	req: NextRequest,
	context: { params: { conversationId: string } }
) {
	const { conversationId } = context.params;
	void req;
	if (!conversationId || isNaN(Number(conversationId))) {
		return NextResponse.json(
			{ error: 'ID de conversación inválido' },
			{ status: 400 }
		);
	}
	
	const numericId = Number(conversationId);

	try {
		const messages = await db
			.select({
				id: chatMessagesWithConversation.id,
				message: chatMessagesWithConversation.message,
				createdAt: chatMessagesWithConversation.createdAt,
				senderId: chatMessagesWithConversation.senderId,
				senderName: users.name,
			})
			.from(chatMessagesWithConversation)
			.leftJoin(users, eq(chatMessagesWithConversation.senderId, users.id))
			.where(eq(chatMessagesWithConversation.conversationId, numericId))
			.orderBy(asc(chatMessagesWithConversation.createdAt));

		return NextResponse.json({ messages });
	} catch (error) {
		console.error('Error fetching messages:', error);
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
