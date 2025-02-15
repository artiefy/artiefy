import { Redis } from '@upstash/redis';
import { type NextRequest, NextResponse } from 'next/server';
import type { Question } from '~/types/typesActi';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
	try {
		const { pathname } = new URL(request.url);
		const activityId = pathname.split('/').pop();
		if (!activityId) {
			return NextResponse.json(
				{ success: false, message: 'Se requiere activityId' },
				{ status: 400 }
			);
		}
		const key = `activity:${activityId}:questions`;
		const questions = (await redis.get<Question[]>(key)) ?? [];
		const totalPeso = questions.reduce(
			(acc, question) => acc + question.pesoPregunta,
			0
		);
		return NextResponse.json({ success: true, totalPeso });
	} catch (error) {
		console.error('Error en la API route:', error);
		return NextResponse.json(
			{ success: false, message: 'Error en el servidor' },
			{ status: 500 }
		);
	}
}
