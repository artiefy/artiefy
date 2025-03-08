'use server';

import { currentUser } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';

import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';

interface ActivityAnswersData {
	answers: Record<
		string,
		{
			questionId: string;
			answer: string;
			isCorrect: boolean;
		}
	>;
	score: number;
	passed: boolean;
	submittedAt: string;
}

interface RedisResponse {
	answers: ActivityAnswersData['answers'];
	score: number;
	passed: boolean;
	submittedAt: string;
}

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function completeActivity(activityId: number): Promise<void> {
	const user = await currentUser();
	if (!user?.id) throw new Error('Usuario no autenticado');

	try {
		const redisKey = `activity:${activityId}:user:${user.id}:answers`;
		const rawData = await redis.get<RedisResponse>(redisKey);

		if (!rawData) {
			throw new Error('No se encontraron respuestas');
		}

		// Verificar y validar los datos
		if (!('score' in rawData) || typeof rawData.score !== 'number') {
			throw new Error('Datos de respuesta inválidos');
		}

		if (rawData.score < 3) {
			throw new Error('No se alcanzó la puntuación mínima');
		}

		// Guardar progreso en la base de datos
		await db
			.insert(userActivitiesProgress)
			.values({
				userId: user.id,
				activityId,
				progress: 100,
				isCompleted: true,
				lastUpdated: new Date(),
				revisada: false,
			})
			.onConflictDoUpdate({
				target: [
					userActivitiesProgress.userId,
					userActivitiesProgress.activityId,
				],
				set: {
					progress: 100,
					isCompleted: true,
					lastUpdated: new Date(),
				},
			});

		console.log('Activity progress saved successfully');
	} catch (error) {
		console.error('Error completing activity:', error);
		throw error;
	}
}
