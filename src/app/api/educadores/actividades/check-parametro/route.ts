import { db } from '~/server/db';
import { activities } from '~/server/db/schema';
import { and, eq, isNotNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const parametroId = searchParams.get('parametroId');

		if (!parametroId) {
			return NextResponse.json(
				{ error: 'Parametro ID es requerido' },
				{ status: 400 }
			);
		}

		// Buscar actividades que usen este parámetro
		const actividades = await db
			.select()
			.from(activities)
			.where(
				and(
					isNotNull(activities.parametroId),
					eq(activities.parametroId, parseInt(parametroId, 10))
				)
			);

		// El parámetro está en uso si hay alguna actividad que lo use
		const isUsed = actividades.length > 0;

		return NextResponse.json({ isUsed });
	} catch (error) {
		console.error('Error al verificar el parámetro:', error);
		return NextResponse.json(
			{ error: 'Error al verificar el parámetro' },
			{ status: 500 }
		);
	}
}
