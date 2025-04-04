import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { nivel } from '~/server/db/schema';

export async function GET() {
	try {
		// Usando Drizzle para obtener los niveles
		const allNivel = await db.select().from(nivel);
		return NextResponse.json(allNivel);
	} catch (error) {
		console.error('❌ Error al obtener los niveles:', error);

		// Handle database connection errors
		if (
			error instanceof Error &&
			error.message.includes('Connect Timeout Error')
		) {
			return NextResponse.json(
				{
					error: 'Error de conexión a la base de datos. Por favor, intente nuevamente más tarde.',
				},
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{
				error: 'Error desconocido al obtener los niveles.',
			},
			{ status: 500 }
		);
	}
}
