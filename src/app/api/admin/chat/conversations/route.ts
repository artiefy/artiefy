import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { conversations, users } from '~/server/db/schema';

export async function GET() {
  try {
    const activeConversations = await db
      .select({
        id: conversations.id,
        senderId: conversations.senderId,
        status: conversations.status,
        userName: users.name,
      })
      .from(conversations)
      .leftJoin(users, eq(conversations.senderId, users.id))
      .where(eq(conversations.status, 'activo'));

    return NextResponse.json({ conversations: activeConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
