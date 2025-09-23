import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { chat_messages } from '~/server/db/schema';

export async function POST(req: Request) {
  try {
    const { conversationId } = (await req.json()) as {
      conversationId?: number;
    };

    if (!conversationId || typeof conversationId !== 'number') {
      return NextResponse.json(
        { error: 'conversationId es requerido y debe ser número' },
        { status: 400 }
      );
    }

    // Eliminar mensajes asociados a la conversación
    await db
      .delete(chat_messages)
      .where(eq(chat_messages.conversation_id, conversationId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error eliminando conversación:', err);
    return NextResponse.json(
      { error: 'Error eliminando conversación' },
      { status: 500 }
    );
  }
}
