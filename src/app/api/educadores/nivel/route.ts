import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { nivel } from '~/server/db/schema';

export async function GET() {
	try {
		// Usando Drizzle para obtener las categorías
		const allNivel = await db.select().from(nivel);

		return NextResponse.json(allNivel);
	} catch (error) {
		console.error('Error al obtener las categorías:', error);
		return NextResponse.json(
			{ message: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
