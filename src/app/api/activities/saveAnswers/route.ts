import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';

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
		const { activityId, userId } = data;

		// Obtener la actividad y sus detalles
		const activityKey = `activity:${activityId}`;
		const activity = await redis.get<ActivityData>(activityKey);
		const attemptsKey = `activity:${activityId}:user:${userId}:attempts`;
		const currentAttempts = (await redis.get<number>(attemptsKey)) ?? 0;

		// Verificar límite de intentos si la actividad es revisada
		if (activity?.revisada && currentAttempts >= 3) {
			return NextResponse.json(
				{
					success: false,
					canClose: false,
					message: 'Has alcanzado el límite de intentos para esta actividad',
					attemptsExhausted: true,
				},
				{ status: 403 }
			);
		}

		// Calcular score con peso de preguntas
		const weightedScore = calculateWeightedScore(data.answers);
		const passed = weightedScore >= 3;

		// Guardar resultados
		const results: ActivityResults = {
			answers: data.answers,
			score: weightedScore,
			passed,
			submittedAt: new Date().toISOString(),
			attemptCount: currentAttempts + 1,
			finalGrade: weightedScore,
			parameterId: activity?.parametroId ?? undefined,
		};

		// Guardar en Redis
		const resultsKey = `activity:${activityId}:user:${userId}:results`;
		await redis.set(resultsKey, JSON.stringify(results));

		// Incrementar contador de intentos
		if (activity?.revisada) {
			await redis.incr(attemptsKey);
		}

		return NextResponse.json({
			success: passed,
			canClose: passed,
			message: passed
				? 'Actividad completada correctamente'
				: 'Debes obtener al menos 3 puntos',
			score: weightedScore,
			attemptsRemaining: activity?.revisada ? 3 - (currentAttempts + 1) : null,
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

	return totalWeight > 0 ? (weightedSum / totalWeight) * 5 : 0;
}
