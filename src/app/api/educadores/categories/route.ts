import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { categories } from '~/server/db/schema';

export async function GET() {
	try {
		// Usando Drizzle para obtener las categorías
		const allCategories = await db.select().from(categories);

		return NextResponse.json(allCategories);
	} catch (error) {
		console.error('Error al obtener las categorías:', error);
		return NextResponse.json(
			{ message: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
