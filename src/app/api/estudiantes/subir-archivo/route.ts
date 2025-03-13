import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

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

		if (!file) {
			return NextResponse.json(
				{ error: 'No se proporcionó ningún archivo' },
				{ status: 400 }
			);
		}

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const fileContent = buffer.toString('base64');

		const key = `activity:${activityId}:${questionId}:${userId}:${Date.now()}`;
		await redis.hset(key, {
			fileContent,
			fileName: file.name,
			submittedAt: new Date().toISOString(),
			userId,
			userName,
			status: 'pendiente',
		});

		// Agregar la clave al índice de la actividad
		const activityIndex = `activity:${activityId}:submissions`;
		await redis.sadd(activityIndex, key);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error al subir el archivo:', error);
		return NextResponse.json(
			{ error: 'Error al subir el archivo' },
			{ status: 500 }
		);
	}
}
