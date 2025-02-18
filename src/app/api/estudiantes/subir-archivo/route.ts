import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const activityId = formData.get('activityId') as string;
		const questionId = formData.get('questionId') as string;
		const userId = formData.get('userId') as string;
		const userName = formData.get('userName') as string;

		if (!file || !activityId || !questionId || !userId || !userName) {
			return new Response('Faltan datos requeridos', { status: 400 });
		}

		// Generamos una clave única para cada archivo usando timestamp
		const timestamp = new Date().getTime();
		const key = `activity:${activityId}:${questionId}:${userId}:${timestamp}`;

		await redis.hset(key, {
			fileName: file.name,
			submittedAt: new Date().toISOString(),
			userId: userId,
			userName: userName,
			status: 'pendiente',
		});

		// Mantenemos un índice de todas las entregas para esta actividad
		const activityIndex = `activity:${activityId}:submissions`;
		await redis.sadd(activityIndex, key);

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error al procesar la subida:', error);
		return new Response(
			JSON.stringify({ error: 'Error al procesar la subida' }),
			{ status: 500 }
		);
	}
}
