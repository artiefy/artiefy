import { Redis } from '@upstash/redis';
import { type NextRequest, NextResponse } from 'next/server';

interface UserAnswer {
	questionId: string;
	answer: string;
	isCorrect: boolean;
}

interface SaveAnswersRequest {
	activityId: number;
	userId: string;
	answers: Record<string, UserAnswer>;
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

		// Solo considerar exitoso si respondió todo Y aprobó
		const success = data.allQuestionsAnswered && data.score >= 3;

		// Guardar en Redis independientemente del resultado
		const redisData = {
			answers: data.answers,
			score: data.score,
			passed: data.score >= 3,
			submittedAt: new Date().toISOString(),
		};

		const redisKey = `activity:${data.activityId}:user:${data.userId}:answers`;

		// Importante: Convertir a string antes de guardar
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
