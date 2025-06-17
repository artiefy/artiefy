'use server';

import { db } from '~/server/db';
import { conversations, chat_messages } from '~/server/db/schema';
import { eq, and } from 'drizzle-orm';

interface CreateConversationParams {
    senderId: string;
    title: string;
    cursoId?: number; 
}

export async function getOrCreateConversation({
  senderId,
  cursoId,
  title,
}: {
  senderId: string;
  cursoId: number;
  title?: string;
}) {
  // Buscar si ya existe una conversación con ese curso_id
  const existing = await db
    .select()
    .from(conversations)
    .where(eq(conversations.curso_id, cursoId))
    .limit(1)
    .then((rows) => rows[0]);

  if (existing) return existing;

  // Si no existe, crearla
  const [created] = await db
    .insert(conversations)
    .values({
      senderId,
      curso_id: cursoId,
      title: title ?? '',
    })
    .returning();

  return created;
}


export async function findConversationById(courseId: number, userId: string) {
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
    messages: typeof chat_messages.$inferSelect[];
}> {

    let conversation = undefined;
    let msgs: typeof chat_messages.$inferSelect[] = [];
    if (curso_id !== null) {
        conversation = await db
            .select()
            .from(conversations)
            .where(eq(conversations.curso_id, curso_id))
            .limit(1)
            .then((rows) => rows[0]);

        if (conversation) {
            msgs = await db
            .select()
            .from(chat_messages)
            .where(eq(chat_messages.conversation_id, conversation.id))
            .orderBy(chat_messages.id);
        }
    }else {
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


export async function getConversationByUserId(user_id: string): Promise<{
    conversations: typeof conversations.$inferSelect[];
}> {
    
    const conversationsList = await db
        .select()
        .from(conversations)
        .where(eq(conversations.senderId, user_id));

    return {
        conversations: conversationsList,
    };
}