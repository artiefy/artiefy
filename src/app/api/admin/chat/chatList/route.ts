import { NextResponse } from 'next/server';

import { sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { chatMessages } from '~/server/db/schema';

export async function GET() {
	try {
		const chats = await db.execute(
			sql`
				SELECT DISTINCT ON (${chatMessages.senderId}) 
					${chatMessages.senderId}, 
					${chatMessages.createdAt} 
				FROM ${chatMessages}
				ORDER BY ${chatMessages.senderId}, ${chatMessages.createdAt} DESC
			`
		);

		const chatList = chats.rows.map((chat) => chat.sender_id); // 👈🏻 Acceso a snake_case correcto

		return NextResponse.json({ chats: chatList });
	} catch (error) {
		console.error('❌ Error cargando lista de chats:', error);
		return NextResponse.json({ error: 'Error interno' }, { status: 500 });
	}
}
