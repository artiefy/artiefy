import { NextResponse } from 'next/server';

import { desc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { conversations, users } from '~/server/db/schema';

export async function GET() {
  try {
    const activeConversations = await db
      .select({
        id: conversations.id,
        senderId: conversations.senderId,
        cursoId: conversations.curso_id,
        status: conversations.status,
        createdAt: conversations.createdAt,
        title: conversations.title,
        senderName: users.name,
        senderEmail: users.email,
      })
      .from(conversations)
      .innerJoin(users, eq(conversations.senderId, users.id))
      .where(eq(conversations.status, 'activo'))
      .orderBy(desc(conversations.createdAt));

    return NextResponse.json({ conversations: activeConversations });
  } catch (error) {
    console.error('❌ Error cargando lista de chats:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
