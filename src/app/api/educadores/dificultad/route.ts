import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { dificultad } from '~/server/db/schema';

export async function GET() {
	try {
		// Usando Drizzle para obtener las categorías
		const allDificultad = await db.select().from(dificultad);

		return NextResponse.json(allDificultad);
	} catch (error) {
		console.error('Error al obtener las categorías:', error);
		return NextResponse.json(
			{ message: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
