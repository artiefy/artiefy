'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { chat_messages, conversations } from '~/server/db/schema';

import { getOrCreateConversation } from './saveChat';

// Modifica el tipo para aceptar coursesData
interface MessageToSave {
  text: string;
  sender: string;
  sender_id: string;
  coursesData?: { id: number; title: string }[];
}

export async function saveMessages(
  senderId: string,
  conversationOrCursoId: number | null,
  messages: MessageToSave[]
) {
  // Primero intentar interpretar el parámetro como conversation.id
  let conversation: typeof conversations.$inferSelect | undefined = undefined;

  if (conversationOrCursoId !== null && conversationOrCursoId !== undefined) {
    // Intentar buscar una conversación con este id
    conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationOrCursoId))
      .limit(1)
      .then((rows) => rows[0]);
  }

  // Si no existe, tratar el valor como cursoId y usar getOrCreateConversation
  if (!conversation) {
    const cursoId = conversationOrCursoId ?? null;
    conversation = await getOrCreateConversation({
      senderId,
      cursoId,
    });
  }

  for (const msg of messages) {
    const insertObj: {
      conversation_id: number;
      sender: string;
      senderId: string;
      message: string;
      courses_data?: { id: number; title: string }[];
    } = {
      conversation_id: conversation.id,
      sender: msg.sender,
      senderId: msg.sender_id,
      message: msg.text,
    };
    if (msg.coursesData && msg.coursesData.length > 0) {
      insertObj.courses_data = msg.coursesData;
    }
    await db.insert(chat_messages).values(insertObj);
  }

  // Actualizar el updatedAt de la conversación
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversation.id));
}
