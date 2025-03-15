'use server';

import { currentUser } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import { eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';

import type { ActivityResults } from '~/types';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const completeActivity = async (activityId: number, userId: string) => {
	try {
		// Verificar usuario autenticado
		const user = await currentUser();
		if (!user) {
			throw new Error('Usuario no autenticado');
		}

		// 1. Obtener actividad y sus detalles
		const activity = await db.query.activities.findFirst({
			where: (activities, { eq }) => eq(activities.id, activityId),
			with: {
				parametro: true,
				lesson: {
					with: {
						course: true,
					},
				},
			},
		});

		if (!activity) {
			throw new Error('Actividad no encontrada');
		}

		// 2. Obtener resultados de Redis
		const resultsKey = `activity:${activityId}:user:${userId}:results`;
		const rawData = await redis.get<ActivityResults>(resultsKey);

		if (!rawData) {
			// Verificar si ya está completada en la base de datos
			const existingProgress = await db.query.userActivitiesProgress.findFirst({
				where: (progress) =>
					eq(progress.activityId, activityId) && eq(progress.userId, userId),
			});

			if (existingProgress?.isCompleted) {
				return { success: true, message: 'Actividad ya completada' };
			}

			throw new Error('No se encontraron resultados de la actividad');
		}

		// 3. Actualizar progreso de actividad
		const activityProgress = {
			userId,
			activityId,
			progress: 100,
			isCompleted: true,
			lastUpdated: new Date(),
			revisada: activity.revisada,
			attemptCount: rawData.attemptCount ?? 1,
			finalGrade: rawData.finalGrade,
			lastAttemptAt: new Date(),
		};

		await db
			.insert(userActivitiesProgress)
			.values(activityProgress)
			.onConflictDoUpdate({
				target: [
					userActivitiesProgress.userId,
					userActivitiesProgress.activityId,
				],
				set: activityProgress,
			});

		// 4. Si hay parámetro asociado, actualizar notas
		if (activity.parametroId) {
			// Update parameter grades using raw SQL
			await db.execute(sql`
				INSERT INTO parameter_grades (parameter_id, user_id, grade, updated_at)
				VALUES (${activity.parametroId}, ${userId}, ${rawData.finalGrade}, NOW())
				ON CONFLICT (parameter_id, user_id) 
				DO UPDATE SET grade = ${rawData.finalGrade}, updated_at = NOW()
			`);

			// Handle materia grades if there's a course
			if (activity.lesson?.course?.id) {
				await db.execute(sql`
					WITH course_materias AS (
						SELECT id FROM materias WHERE courseid = ${activity.lesson.course.id}
					)
					INSERT INTO materia_grades (materia_id, user_id, grade, updated_at)
					SELECT id, ${userId}, ${rawData.finalGrade}, NOW()
					FROM course_materias
					ON CONFLICT (materia_id, user_id) 
					DO UPDATE SET grade = EXCLUDED.grade, updated_at = EXCLUDED.updated_at
				`);
			}
		}

		return { success: true, message: 'Actividad completada exitosamente' };
	} catch (error) {
		console.error('Error completing activity:', error);
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: 'Error al completar la actividad',
		};
	}
};
