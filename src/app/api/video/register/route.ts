import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import axios from 'axios';

import { updateLesson } from '~/models/educatorsModels/lessonsModels';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
	}

	try {
		const { key, lessonId } = (await req.json()) as {
			key: string;
			lessonId: number;
		};

		if (!key || !lessonId) {
			return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
		}

		// Registrar el video en la lección
		await updateLesson(lessonId, { coverVideoKey: key });

		// Procesar transcripción en segundo plano
		const s3Url = `https://s3.us-east-2.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${key}`;
		console.log('Enviando a transcribir:', s3Url);

		void (async () => {
			try {
				const res = await axios.post(
					'http://18.118.184.174:8000/video2text',
					{ url: s3Url },
					{
						headers: {
							'Content-Type': 'application/json',
						},
						timeout: 9 * 60 * 1000, // 5 minutos
					}
				);

				if (!Array.isArray(res.data)) {
					console.error('Transcripción con formato inválido:', res.data);
					return;
				}

				await redis.set(`transcription:lesson:${lessonId}`, res.data);
				console.log('Transcripción guardada en Redis para lesson:', lessonId);
			} catch (err) {
				console.error('Error al procesar transcripción en background:', err);
			}
		})();

		return NextResponse.json({
			message: 'Video registrado correctamente y transcripción iniciada',
			key,
		});
	} catch (error) {
		console.error('Error al registrar el video:', error);
		return NextResponse.json(
			{ error: 'Error al registrar el video' },
			{ status: 500 }
		);
	}
}
