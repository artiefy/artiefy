'use server';

import { currentUser } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	userActivitiesProgress,
	materiaGrades,
	parameterGrades,
} from '~/server/db/schema';

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
			const parameterGrade = {
				parameterId: activity.parametroId,
				userId,
				grade: rawData.finalGrade,
				updatedAt: new Date(),
			};

			await db
				.insert(parameterGrades)
				.values(parameterGrade)
				.onConflictDoUpdate({
					target: [parameterGrades.parameterId, parameterGrades.userId],
					set: parameterGrade,
				});

			// 5. Si hay curso asociado, calcular y actualizar nota de materias
			if (activity.lesson?.course) {
				const courseId = activity.lesson.course.id;
				const materias = await db.query.materias.findMany({
					where: (materias, { eq }) => eq(materias.courseid, courseId),
				});

				// Calcular promedio de parámetros para el curso
				const parameters = await db.query.parameterGrades.findMany({
					where: (pg) =>
						eq(pg.userId, userId) &&
						eq(pg.parameterId, activity.parametroId ?? 0), // Use || 0 to handle null case
				});

				const avgGrade =
					parameters.reduce((sum, p) => sum + p.grade, 0) / parameters.length;

				// Actualizar notas de materias
				for (const materia of materias) {
					await db
						.insert(materiaGrades)
						.values({
							materiaId: materia.id,
							userId,
							grade: avgGrade,
							updatedAt: new Date(),
						})
						.onConflictDoUpdate({
							target: [materiaGrades.materiaId, materiaGrades.userId],
							set: { grade: avgGrade, updatedAt: new Date() },
						});
				}
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
