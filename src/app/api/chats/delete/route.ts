import { NextResponse } from 'next/server';

import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { chat_messages, conversations } from '~/server/db/schema';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // SAFE: tipar body como unknown y validar explicitamente conversationId
    const body = (await req.json()) as unknown;
    const conversationIdRaw =
      typeof body === 'object' && body !== null && 'conversationId' in body
        ? (body as Record<string, unknown>).conversationId
        : undefined;

    const conversationId =
      typeof conversationIdRaw === 'number'
        ? conversationIdRaw
        : typeof conversationIdRaw === 'string'
          ? Number(conversationIdRaw)
          : NaN;

    if (!Number.isFinite(conversationId) || conversationId <= 0) {
      return NextResponse.json(
        { error: 'conversationId inválido' },
        { status: 400 }
      );
    }

    // Obtener conversación y verificar owner
    const convo = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!convo) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    if (convo.senderId !== user.id) {
      // impedir que otro usuario borre la conversación
      return NextResponse.json(
        { error: 'No tienes permisos' },
        { status: 403 }
      );
    }

    // Borrar mensajes y conversación
    await db
      .delete(chat_messages)
      .where(eq(chat_messages.conversation_id, conversationId));
    await db.delete(conversations).where(eq(conversations.id, conversationId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting conversation:', err);
    return NextResponse.json(
      { error: 'Error eliminando conversación' },
      { status: 500 }
    );
  }
}
