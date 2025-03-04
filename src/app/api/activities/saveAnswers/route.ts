import { Redis } from '@upstash/redis';
import { type NextRequest, NextResponse } from 'next/server';
import type { SavedAnswer, ActivityResults } from '~/types';

interface SaveAnswersRequest {
	activityId: number;
	userId: string;
	answers: Record<string, SavedAnswer>;
	score: number;
	allQuestionsAnswered: boolean;
}

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: NextRequest) {
	try {
		const data = (await request.json()) as SaveAnswersRequest;
		const success = data.allQuestionsAnswered && data.score >= 3;

		const redisData: ActivityResults = {
			answers: data.answers,
			score: data.score,
			passed: data.score >= 3,
			submittedAt: new Date().toISOString(),
		};

		const redisKey = `activity:${data.activityId}:user:${data.userId}:answers`;

		await redis.set(redisKey, JSON.stringify(redisData));

		return NextResponse.json({
			success,
			canClose: success,
			message: success
				? 'Actividad completada correctamente'
				: 'Debes obtener al menos 3 puntos',
			score: data.score,
		});
	} catch (error) {
		console.error('Error saving answers:', error);
		return NextResponse.json(
			{ success: false, error: 'Error al guardar las respuestas' },
			{ status: 500 }
		);
	}
}
