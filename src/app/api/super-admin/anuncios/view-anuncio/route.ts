import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { anuncios } from '~/server/db/schema';

export async function GET() {
	try {
		// Obtener el último anuncio activo
		const anuncioActivo = await db
			.select()
			.from(anuncios)
			.where(eq(anuncios.activo, true)) // Filtrar solo los anuncios activos
			.orderBy(desc(anuncios.id))
			.limit(1); // Obtener solo el más reciente

		return NextResponse.json(
			anuncioActivo.length > 0 ? anuncioActivo[0] : null
		);
	} catch (error) {
		console.error('❌ Error al obtener el anuncio activo:', error);
		return NextResponse.json(
			{ message: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
