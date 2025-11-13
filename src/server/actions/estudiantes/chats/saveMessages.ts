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
  cursoId: number,
  messages: MessageToSave[]
) {
  const conversation = await getOrCreateConversation({
    senderId,
    cursoId,
  });

  for (const msg of messages) {
    // Si coursesData es undefined, no agregues el campo (no lo incluyas en el objeto)
    // Si coursesData es un array vacío, tampoco lo agregues
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
