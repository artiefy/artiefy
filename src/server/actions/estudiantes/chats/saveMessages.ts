'use server';

import { db } from '~/server/db';
import { chat_messages } from '~/server/db/schema';

import { getOrCreateConversation } from './saveChat';



export async function saveMessages(
  senderId: string,
  cursoId: number,
  messages: {
    text: string;
    sender: string;
    sender_id: string;
  }[]
) {
  const conversation = await getOrCreateConversation({
    senderId,
    cursoId,
  });

  await db.insert(chat_messages).values(
    messages.map((msg) => ({
      senderId: msg.sender_id,
      conversation_id: conversation.id,
      sender: msg.sender,
      message: msg.text,
    }))
  );
}
