import { type NextRequest, NextResponse } from 'next/server';

import { asc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { chat_messages, users } from '~/server/db/schema';

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
        id: chat_messages.id,
        message: chat_messages.message,
        createdAt: chat_messages.created_at,
        senderId: chat_messages.senderId,
        sender: chat_messages.sender,
        senderName: users.name,
      })
      .from(chat_messages)
      .leftJoin(users, eq(chat_messages.senderId, users.id))
      .where(eq(chat_messages.conversation_id, numericId))
      .orderBy(asc(chat_messages.created_at));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
