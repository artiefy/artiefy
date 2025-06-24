import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';

import type { Completado, Question,VerdaderoOFlaso } from '~/types/typesActi';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

function safeParse<T>(data: unknown): T {
	if (typeof data === 'string') {
		try {
			return JSON.parse(data) as T;
		} catch {
			return [] as T;
		}
	}
	if (Array.isArray(data)) {
		return data as T;
	}
	return [] as T;
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const activityId = searchParams.get('activityId');

		if (!activityId) {
			return NextResponse.json(
				{ success: false, message: 'Se requiere activityId' },
				{ status: 400 }
			);
		}

		const keyOM = `activity:${activityId}:questionsOM`;
		const keyVOF = `activity:${activityId}:questionsVOF`;
		const keyCompletar = `activity:${activityId}:questionsACompletar`;

		// Obtener desde Redis

		// Parsear solo si es string
		const questionsOM: Question[] = safeParse<Question[]>(
			await redis.get(keyOM)
		);
		const questionsVOF: VerdaderoOFlaso[] = safeParse<VerdaderoOFlaso[]>(
			await redis.get(keyVOF)
		);
		const questionsACompletar: Completado[] = safeParse<Completado[]>(
			await redis.get(keyCompletar)
		);

		// Calcular total correctamente
		const totalPercentage = [
			...questionsOM,
			...questionsVOF,
			...questionsACompletar,
		].reduce(
			(total, question) => total + Number(question.pesoPregunta || 0),
			0
		);

		return NextResponse.json({ totalPercentage });
	} catch (error) {
		console.error('Error fetching total percentage:', error);
		return NextResponse.json(
			{ success: false, message: 'Error en el servidor' },
			{ status: 500 }
		);
	}
}
