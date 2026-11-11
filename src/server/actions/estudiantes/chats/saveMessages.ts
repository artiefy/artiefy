'use server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

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
  _senderId: string,
  conversationOrCursoId: number | null,
  messages: MessageToSave[]
) {
  const { userId: senderId } = await auth();
  if (!senderId) throw new Error('No autorizado');

  // Primero intentar interpretar el parámetro como conversation.id
  let conversation: typeof conversations.$inferSelect | undefined = undefined;

  if (conversationOrCursoId !== null && conversationOrCursoId !== undefined) {
    // Solo conversaciones del usuario autenticado
    conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationOrCursoId),
          eq(conversations.senderId, senderId)
        )
      )
      .limit(1)
      .then((rows) => rows[0]);
  }

  // Si no existe, tratar el valor como cursoId y usar getOrCreateConversation
  // No se encontró una conversación con el id proporcionado.
  // No debemos interpretar automáticamente el parámetro numérico
  // como `cursoId`, porque en el frontend a veces usamos ids
  // temporales (Date.now()) o ids de sesión que no corresponden
  // a `curso_id` en la BD. Para evitar colisiones y que varios
  // chats compartan la misma conversación, creamos una nueva
  // conversación explícita asociada al `senderId` y con `curso_id` = null.
  conversation ??= await getOrCreateConversation({ cursoId: null });

  for (const msg of messages) {
    const insertObj: {
      conversation_id: number;
      sender: string;
      senderId: string;
      message: string;
      courses_data?: { id: number; title: string }[];
    } = {
      conversation_id: conversation.id,
      // Only the bot or the session user can author a message in the chat.
      sender: msg.sender === 'bot' ? 'bot' : 'user',
      senderId: msg.sender === 'bot' ? 'bot' : senderId,
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
