import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import {
	getActivitiesByLessonId,
	getTotalPorcentajeByParametro,
} from '~/models/educatorsModels/activitiesModels';

function respondWithError(message: string, status: number) {
	return NextResponse.json({ error: message }, { status });
}

// GET endpoint para obtener una actividad por ID
export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return respondWithError('No autorizado', 403);
		}

		const { searchParams } = new URL(request.url);
		const lessonsId = searchParams.get('lessonId');
		if (!lessonsId) {
			return respondWithError('ID de actividad no proporcionado', 400);
		}

		const activities = await getActivitiesByLessonId(parseInt(lessonsId, 10));
		if (!activities) {
			return respondWithError('Actividad no encontrada', 404);
		}

		return NextResponse.json(activities);
	} catch (error: unknown) {
		console.error('Error al obtener la actividad:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido';
		return respondWithError(
			`Error al obtener la actividad: ${errorMessage}`,
			500
		);
	}
}

// Agregar nueva ruta para validar porcentaje
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return respondWithError('No autorizado', 403);
		}

		const data = await request.json() as { parametroId: number; porcentaje: number };
		const { parametroId, porcentaje } = data;

		if (!parametroId || porcentaje === undefined) {
			return respondWithError('Datos incompletos', 400);
		}

		const resultado = await getTotalPorcentajeByParametro(parametroId);
		const nuevoPorcentajeTotal = resultado.total + porcentaje;

		// Validación más estricta
		if (nuevoPorcentajeTotal > 100 || nuevoPorcentajeTotal < 0) {
			return respondWithError(
				`No se puede exceder el 100% del parámetro.\n` +
					`Porcentaje actual total: ${resultado.total}%\n` +
					`Porcentajes asignados:\n${resultado.actividades
						.map((act) => `- ${act.name}: ${act.porcentaje}%`)
						.join('\n')}\n` +
					`Disponible: ${Math.max(0, 100 - resultado.total)}%`,
				400
			);
		}

		return NextResponse.json({
			isValid: true,
			totalActual: resultado.total,
			disponible: 100 - resultado.total,
			detalles: resultado.actividades,
		});
	} catch (error) {
		console.error('Error al validar porcentaje:', error);
		return respondWithError('Error al validar el porcentaje', 500);
	}
}
