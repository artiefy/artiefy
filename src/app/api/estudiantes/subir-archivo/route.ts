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

		const user = await currentUser();

		if (!user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
		}

		// Convertir el archivo a base64 para almacenarlo
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const base64File = buffer.toString('base64');

		// Crear una clave única para la respuesta
		const responseKey = `activity:${activityId}:question:${questionId}:user:${user.id}`;

		// Almacenar la respuesta en Upstash
		await redis.hset(responseKey, {
			fileName: file.name,
			fileContent: base64File,
			submittedAt: new Date().toISOString(),
			userId: user.id,
			status: 'pendiente',
			grade: null,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error al procesar la subida:', error);
		return NextResponse.json(
			{ error: 'Error al procesar la subida del archivo' },
			{ status: 500 }
		);
	}
}
