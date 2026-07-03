import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { chat_messages, conversations } from '~/server/db/schema';

export async function POST(req: Request) {
  try {
    // Security best practice: authenticate and verify the conversation belongs
    // to the caller before deleting its messages (prevents deleting another
    // user's conversation by id).
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { conversationId } = (await req.json()) as {
      conversationId?: number;
    };

    if (!conversationId || typeof conversationId !== 'number') {
      return NextResponse.json(
        { error: 'conversationId es requerido y debe ser número' },
        { status: 400 }
      );
    }

    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      columns: { id: true, senderId: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    if (conversation.senderId !== userId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Eliminar mensajes asociados a la conversación
    await db
      .delete(chat_messages)
      .where(eq(chat_messages.conversation_id, conversationId));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Error eliminando conversación' },
      { status: 500 }
    );
  }
}
