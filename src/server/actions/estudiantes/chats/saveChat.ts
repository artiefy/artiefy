'use server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { chat_messages, conversations } from '~/server/db/schema';

// Every exported function here is a public server action: the caller is always
// resolved from the session and any client-supplied user id is ignored.
async function requireSessionUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('No autorizado');
  return userId;
}

export async function getOrCreateConversation({
  cursoId = null,
  title,
}: {
  /** @deprecated Ignored: the owner is always the signed-in user. */
  senderId?: string;
  cursoId?: number | null;
  title?: string;
}) {
  const senderId = await requireSessionUserId();
  // Si se pasa un cursoId válido, intentar reutilizar la conversación
  // asociada a ese curso y a este usuario (evitar devolver conversaciones
  // de otros usuarios cuando cursoId === null).
  if (cursoId !== null && cursoId !== undefined) {
    const existing = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.curso_id, cursoId),
          eq(conversations.senderId, senderId)
        )
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (existing) return existing;
  }

  // Para chats de IA (cursoId === null) no reutilizamos una conversación
  // global: creamos una nueva conversación por cada llamada para evitar
  // que distintos usuarios compartan la misma conversación cuando
  // curso_id es NULL.
  const [created] = await db
    .insert(conversations)
    .values({
      senderId,
      curso_id: cursoId ?? null,
      title: title ?? '',
      fechaPrograma: new Date().toISOString().slice(0, 10),
    })
    .returning();

  return created;
}

export async function findConversationById(courseId: number, _userId?: string) {
  const { userId } = await auth();
  if (!userId) return undefined;
  const conversation = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.curso_id, courseId),
        eq(conversations.senderId, userId)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  return conversation;
}

export async function getConversationWithMessages(curso_id: number): Promise<{
  conversation: typeof conversations.$inferSelect | undefined;
  messages: (typeof chat_messages.$inferSelect)[];
}> {
  let conversation: typeof conversations.$inferSelect | undefined = undefined;
  let msgs: (typeof chat_messages.$inferSelect)[] = [];
  const { userId } = await auth();
  if (!userId) {
    return { conversation: undefined, messages: [] };
  }
  if (curso_id !== null) {
    conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.curso_id, curso_id),
          eq(conversations.senderId, userId)
        )
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (conversation) {
      msgs = await db
        .select()
        .from(chat_messages)
        .where(eq(chat_messages.conversation_id, conversation.id))
        .orderBy(chat_messages.id);
    }
  } else {
    return {
      conversation: undefined,
      messages: [],
    };
  }

  return {
    conversation,
    messages: msgs,
  };
}

export async function getConversationById(conversationId: number): Promise<{
  conversation: typeof conversations.$inferSelect | undefined;
  messages: (typeof chat_messages.$inferSelect)[];
}> {
  const { userId } = await auth();
  if (!userId) return { conversation: undefined, messages: [] };

  const conversation = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.senderId, userId)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  let msgs: (typeof chat_messages.$inferSelect)[] = [];
  if (conversation) {
    msgs = await db
      .select()
      .from(chat_messages)
      .where(eq(chat_messages.conversation_id, conversation.id))
      .orderBy(chat_messages.id);
  }

  return {
    conversation,
    messages: msgs,
  };
}

export async function getConversationByUserId(_user_id?: string): Promise<{
  conversations: (typeof conversations.$inferSelect)[];
}> {
  const { userId: user_id } = await auth();
  if (!user_id) return { conversations: [] };

  const conversationsList = await db
    .select()
    .from(conversations)
    .where(eq(conversations.senderId, user_id));

  return {
    conversations: conversationsList,
  };
}

export async function deleteConversation(
  conversationId: number
): Promise<void> {
  const userId = await requireSessionUserId();

  const owned = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.senderId, userId)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);
  if (!owned) throw new Error('No autorizado');

  // Eliminar mensajes primero
  await db
    .delete(chat_messages)
    .where(eq(chat_messages.conversation_id, conversationId));

  // Luego eliminar la conversación
  await db.delete(conversations).where(eq(conversations.id, conversationId));
}
