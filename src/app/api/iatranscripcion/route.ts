import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

import axios, { isAxiosError } from 'axios';

const VIDEO_TO_TEXT_API = 'http://3.145.183.203:8000/video2text';
const DEFAULT_TIMEOUT = 300000;
const CACHE_DURATION = 3600; // 1 hora

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as { url?: string };
		let url = body.url;

		if (!url) {
			return NextResponse.json(
				{ error: 'URL del video es requerida' },
				{ status: 400 }
			);
		}

		// Asegurar que la URL está bien formada
		if (!url.startsWith('http')) {
			url = `https://s3.us-east-2.amazonaws.com/artiefy-upload/${url}`;
		}

		console.log('Procesando solicitud para URL:', url);

		const cacheKey = `transcription-${url}`;

		// Obtener caché si existe
		const getCachedTranscription = unstable_cache(
			() => Promise.resolve(null), // Si no hay caché, devuelve null
			[cacheKey]
		);

		const cachedResponse = await getCachedTranscription();

		if (cachedResponse) {
			console.log('Transcripción obtenida de la caché');
			return NextResponse.json({ transcription: cachedResponse });
		}

		// Petición al API externo
		const response = await axios.post(
			VIDEO_TO_TEXT_API,
			{ url },
			{
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				timeout: DEFAULT_TIMEOUT,
				validateStatus: (status) => status === 200,
			}
		);

		console.log('Respuesta del API:', {
			status: response.status,
			data: response.data as TranscriptionItem[],
		});

		// Validar el formato de la respuesta
		if (!Array.isArray(response.data)) {
			console.error('Formato de respuesta inválido:', response.data);
			return NextResponse.json(
				{ error: 'Formato de respuesta inválido del servicio' },
				{ status: 502 }
			);
		}

		// Guardar en caché la transcripción
		const cacheTranscription = unstable_cache(
			(): Promise<TranscriptionItem[]> => Promise.resolve(response.data),
			[cacheKey],
			{ revalidate: CACHE_DURATION }
		);

		await cacheTranscription();

		// Devolver la transcripción
		return NextResponse.json({ transcription: response.data });
	} catch (error: unknown) {
		console.error('Error detallado:', error);

		if (isAxiosError(error)) {
			if (error.code === 'ECONNABORTED') {
				return NextResponse.json(
					{ error: 'Tiempo de espera agotado' },
					{ status: 504 }
				);
			}

			const statusCode = error.response?.status ?? 500;
			const errorMessage =
				(error.response?.data as { error?: string })?.error ??
				(error.response?.data as { message?: string })?.message ??
				error.message;

			return NextResponse.json({ error: errorMessage }, { status: statusCode });
		}

		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}

interface TranscriptionItem {
	start: number;
	end: number;
	text: string;
}
