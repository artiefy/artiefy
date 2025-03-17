import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';
import { formatScoreNumber } from '~/utils/formatScore';

import type { SavedAnswer, ActivityResults } from '~/types';

interface SaveAnswersRequest {
	activityId: number;
	userId: string;
	answers: Record<string, SavedAnswer>;
	score: number;
	allQuestionsAnswered: boolean;
}

interface ActivityData {
	revisada: boolean;
	id: number;
	parametroId: number | null;
}

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: NextRequest) {
	try {
		const data = (await request.json()) as SaveAnswersRequest;
		const { activityId, userId, answers } = data;

		// Obtener la actividad y sus detalles
		const activityKey = `activity:${activityId}`;
		const activity = await redis.get<ActivityData>(activityKey);

		// Obtener el progreso actual del usuario
		const currentProgress = await db.query.userActivitiesProgress.findFirst({
			where: and(
				eq(userActivitiesProgress.userId, userId),
				eq(userActivitiesProgress.activityId, activityId)
			),
		});

		const currentAttempts = currentProgress?.attemptCount ?? 0;

		// Verificar límite de intentos si la actividad es revisada
		if (activity?.revisada && currentAttempts >= 3) {
			return NextResponse.json(
				{
					success: false,
					canClose: true,
					message: 'Has alcanzado el límite de intentos',
					attemptsExhausted: true,
					finalGrade: currentProgress?.finalGrade ?? 0,
				},
				{ status: 403 }
			);
		}

		// Calcular y formatear score
		const weightedScore = calculateWeightedScore(answers);
		const passed = weightedScore >= 3;

		// Preparar resultados con score formateado
		const results: ActivityResults = {
			answers,
			score: weightedScore,
			passed,
			submittedAt: new Date().toISOString(),
			attemptCount: currentAttempts + 1,
			finalGrade: weightedScore,
			parameterId: activity?.parametroId ?? undefined,
			revisada: activity?.revisada,
		};

		// Guardar resultados formateados en Redis
		const resultsKey = `activity:${activityId}:user:${userId}:results`;
		await redis.set(resultsKey, results);

		// Actualizar progreso en la base de datos con score formateado
		await db
			.insert(userActivitiesProgress)
			.values({
				userId,
				activityId,
				progress: 100,
				isCompleted: passed,
				lastUpdated: new Date(),
				revisada: activity?.revisada,
				attemptCount: currentAttempts + 1,
				finalGrade: weightedScore,
				lastAttemptAt: new Date(),
			})
			.onConflictDoUpdate({
				target: [
					userActivitiesProgress.userId,
					userActivitiesProgress.activityId,
				],
				set: {
					progress: 100,
					isCompleted: passed,
					lastUpdated: new Date(),
					attemptCount: currentAttempts + 1,
					finalGrade: Number(weightedScore.toFixed(2)), // Format to 2 decimals
					lastAttemptAt: new Date(),
				},
			});

		// Incrementar contador de intentos en Redis si es revisada
		if (activity?.revisada) {
			const attemptsKey = `activity:${activityId}:user:${userId}:attempts`;
			await redis.set(attemptsKey, currentAttempts + 1);
		}

		return NextResponse.json({
			success: passed || !activity?.revisada,
			canClose: passed || !activity?.revisada,
			message: passed
				? 'Actividad completada correctamente'
				: activity?.revisada
					? `Intento ${currentAttempts + 1}/3 completado`
					: 'Actividad guardada',
			score: weightedScore,
			attemptsRemaining: activity?.revisada ? 3 - (currentAttempts + 1) : null,
			attemptCount: currentAttempts + 1,
		});
	} catch (error) {
		console.error('Error saving answers:', error);
		return NextResponse.json(
			{ success: false, error: 'Error al guardar las respuestas' },
			{ status: 500 }
		);
	}
}

function calculateWeightedScore(answers: Record<string, SavedAnswer>): number {
	let totalWeight = 0;
	let weightedSum = 0;

	Object.values(answers).forEach((answer) => {
		const weight = answer.pesoPregunta ?? 1;
		totalWeight += weight;
		weightedSum += answer.isCorrect ? weight : 0;
	});

	return formatScoreNumber((weightedSum / totalWeight) * 5);
}
