import { auth, currentUser } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';
import { activities, lessons } from '~/server/db/schema';
import { and, eq } from 'drizzle-orm';

import {
	createActivity,
	//getActivitiesByLessonId,
	updateActivity,
	deleteActivity,
} from '~/models/educatorsModels/activitiesModels';
import { ratelimit } from '~/server/ratelimit/ratelimit';

function respondWithError(message: string, status: number) {
	return NextResponse.json({ error: message }, { status });
}

// POST endpoint para crear actividades
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return respondWithError('No autorizado', 403);
		}

		// Implement rate limiting
		const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
		const { success } = await ratelimit.limit(ip);
		if (!success) {
			return respondWithError('Demasiadas solicitudes', 429);
		}

		const clerkUser = await currentUser();
		if (!clerkUser) {
			return respondWithError(
				'No se pudo obtener información del usuario',
				500
			);
		}

		const body = (await request.json()) as {
			name: string;
			description: string;
			lessonsId: number;
			typeid: number;
			revisada: boolean;
			parametroId?: number | null;
		};

		const { name, description, lessonsId, typeid, revisada, parametroId } =
			body;

		const newActivity = await createActivity({
			name,
			description,
			typeid,
			lessonsId,
			revisada,
			parametroId: revisada ? parametroId : null,
		});

		console.log('Datos enviados al servidor:', {
			name,
			description,
			lessonsId,
			typeid,
			revisada,
		});

		return NextResponse.json({
			id: newActivity.id,
			message: 'Actividad creada exitosamente',
		});
	} catch (error) {
		console.error('Error detallado:', error);
		return respondWithError(
			`Error al crear la actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			500
		);
	}
}

// GET endpoint para obtener una actividad por ID
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const courseId = searchParams.get('courseId');

		if (!courseId) {
			return NextResponse.json(
				{ error: 'Course ID es requerido' },
				{ status: 400 }
			);
		}

		// Primero obtener todas las lecciones del curso
		const courseLessons = await db
			.select()
			.from(lessons)
			.where(eq(lessons.courseId, parseInt(courseId)));

		const lessonIds = courseLessons.map((lesson) => lesson.id);

		// Luego obtener todas las actividades de esas lecciones
		const actividades = await db
			.select()
			.from(activities)
			.where(
				and(
					lessonIds.length > 0
						? eq(activities.lessonsId, lessonIds[0])
						: undefined
				)
			);

		return NextResponse.json(actividades);
	} catch (error) {
		console.error('Error al obtener las actividades:', error);
		return NextResponse.json(
			{ error: 'Error al obtener las actividades' },
			{ status: 500 }
		);
	}
}

// PUT endpoint para actualizar una actividad
export async function PUT(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return respondWithError('No autorizado', 403);
		}

		const body = (await request.json()) as {
			id: number;
			name?: string;
			description?: string;
			typeid?: number;
			revisada?: boolean;
		};

		const { id, name, description, typeid, revisada } = body;

		await updateActivity(id, {
			name,
			description,
			typeid,
			revisada,
		});

		return NextResponse.json({
			message: 'Actividad actualizada exitosamente',
		});
	} catch (error: unknown) {
		console.error('Error al actualizar la actividad:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido';
		return respondWithError(
			`Error al actualizar la actividad: ${errorMessage}`,
			500
		);
	}
}

// DELETE endpoint para eliminar una actividad
export async function DELETE(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return respondWithError('No autorizado', 403);
		}

		const { searchParams } = new URL(request.url);
		const activityId = searchParams.get('id');
		if (!activityId) {
			return respondWithError('ID de actividad no proporcionado', 400);
		}

		await deleteActivity(parseInt(activityId, 10));

		return NextResponse.json({
			message: 'Actividad eliminada exitosamente',
		});
	} catch (error: unknown) {
		console.error('Error al eliminar la actividad:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido';
		return respondWithError(
			`Error al eliminar la actividad: ${errorMessage}`,
			500
		);
	}
}
