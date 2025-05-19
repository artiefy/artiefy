import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { tickets, ticketComments } from '~/server/db/schema';

// Define el tipo esperado para el body
interface BulkDeleteRequestBody {
	ids: (number | string)[];
}

export async function DELETE(req: Request) {
	try {
		const { userId, sessionClaims } = await auth();
		const role = sessionClaims?.metadata.role;

		if (!userId || (role !== 'admin' && role !== 'super-admin')) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = (await req.json()) as BulkDeleteRequestBody;

		const ids = Array.isArray(body.ids)
			? body.ids.map((id) => Number(id)).filter((n): n is number => !isNaN(n))
			: [];

		console.log('📥 IDs recibidos para eliminar:', body.ids);
		console.log('🔢 IDs convertidos a number:', ids);

		if (ids.length === 0) {
			return NextResponse.json(
				{ error: 'No valid IDs provided' },
				{ status: 400 }
			);
		}

		// Eliminar comentarios relacionados
		await db.delete(ticketComments).where(inArray(ticketComments.ticketId, ids));

		// Eliminar tickets
		await db.delete(tickets).where(inArray(tickets.id, ids));

		console.log('✅ Tickets y comentarios eliminados correctamente.');

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('❌ Error deleting multiple tickets:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
