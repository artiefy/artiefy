import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';

import { getActivitiesByLessonId } from '~/models/educatorsModels/activitiesModels';

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
