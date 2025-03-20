import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';

import type { Completado2 } from '~/types/typesActi';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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
		const keyCompletar = `activity:${activityId}:questionsACompletar2`;

		const questionsACompletar =
			(await redis.get<Completado2[]>(keyCompletar)) ?? [];

		const totalPercentage = [...questionsACompletar].reduce(
			(total, question) => total + question.pesoPregunta,
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
