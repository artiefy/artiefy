import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { courseTypes } from '~/server/db/schema'; // Asegúrate de que el nombre de la tabla en tu esquema sea correcto

export async function GET() {
	try {
		// Usando Drizzle para obtener los tipos de curso
		const allTypes = await db.select().from(courseTypes);

		return NextResponse.json(allTypes);
	} catch (error) {
		console.error('Error al obtener los tipos de curso:', error);
		return NextResponse.json(
			{ message: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
