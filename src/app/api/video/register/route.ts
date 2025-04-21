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
		console.log('[VIDEO_REGISTER] ❌ Usuario no autorizado');
		return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
	}

	try {
		const { key, lessonId } = (await req.json()) as {
			key: string;
			lessonId: number;
		};

		if (!key || !lessonId) {
			console.log(
				'[VIDEO_REGISTER] ❌ Faltan datos. key o lessonId no presentes:',
				{ key, lessonId }
			);
			return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
		}

		console.log('[VIDEO_REGISTER] ✅ Datos recibidos correctamente:', {
			key,
			lessonId,
		});

		// Registrar el video en la lección
		await updateLesson(lessonId, { coverVideoKey: key });
		console.log('[VIDEO_REGISTER] ✅ Lección actualizada con video');

		// Crear la URL del archivo en S3
		// Crear la URL del archivo en S3
		const s3Url = `https://s3.us-east-2.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${key}`;
		console.log('[VIDEO_REGISTER] 📹 URL del video en S3 generada:', s3Url);

		// Verificar que el video es accesible antes de transcribir
		try {
			const checkUrl = await fetch(s3Url, { method: 'HEAD' });
			if (!checkUrl.ok) {
				console.error(
					'[VIDEO_REGISTER] ❌ El archivo no es accesible:',
					checkUrl.status
				);
				return NextResponse.json(
					{ error: 'El video no es accesible públicamente' },
					{ status: 400 }
				);
			}
		} catch (err) {
			console.error(
				'[VIDEO_REGISTER] ❌ Error al verificar accesibilidad del video:',
				err
			);
			return NextResponse.json(
				{ error: 'Error al verificar el video' },
				{ status: 500 }
			);
		}

		// Procesar transcripción en segundo plano
		void (async () => {
			try {
				console.log(
					'[TRANSCRIPCIÓN] ⏳ Iniciando solicitud al servidor de transcripción...'
				);
				const res = await axios.post(
					'http://18.118.184.174:8000/video2text',
					{ url: s3Url },
					{
						headers: {
							'Content-Type': 'application/json',
						},
						timeout: 20 * 60 * 1000, // 20 minutos
					}
				);

				console.log('[TRANSCRIPCIÓN] ✅ Respuesta del servidor:', res.data);

				if (!Array.isArray(res.data)) {
					console.error(
						'[TRANSCRIPCIÓN] ❌ Formato inválido recibido. Esperado un array:',
						res.data
					);
					return;
				}

				const redisKey = `transcription:lesson:${lessonId}`;
				await redis.set(redisKey, res.data);
				console.log(
					`[TRANSCRIPCIÓN] ✅ Transcripción guardada en Redis con key "${redisKey}"`
				);
			} catch (err) {
				console.error(
					'[TRANSCRIPCIÓN] ❌ Error durante la transcripción o guardado en Redis:'
				);
				if (axios.isAxiosError(err)) {
					console.error('Axios Error:', err.message);
					console.error('Response data:', err.response?.data);
				} else {
					console.error('Error genérico:', err);
				}
			}
		})();

		return NextResponse.json({
			message: 'Video registrado correctamente y transcripción iniciada',
			key,
		});
	} catch (error) {
		console.error(
			'[VIDEO_REGISTER] ❌ Error general en el registro del video:',
			error
		);
		return NextResponse.json(
			{ error: 'Error al registrar el video' },
			{ status: 500 }
		);
	}
}
