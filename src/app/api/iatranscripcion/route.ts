import { NextResponse } from 'next/server';

import axios, { isAxiosError } from 'axios';

const VIDEO_TO_TEXT_API = 'http://3.145.183.203:8000/video2text';
const DEFAULT_TIMEOUT = 300000; // Aumentar el tiempo de espera a 300 segundos

interface TranscriptionResponse {
	transcription: string;
	error?: string;
}

export async function POST(request: Request) {
	try {
		const { url }: { url: string } = await request.json() as { url: string };

		if (!url) {
			return NextResponse.json(
				{ error: 'URL del video es requerida' },
				{ status: 400 }
			);
		}

		const response = await axios.post<TranscriptionResponse>(
			VIDEO_TO_TEXT_API,
			{ url },
			{
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				timeout: DEFAULT_TIMEOUT,
			}
		);

		const { transcription, error } = response.data;

		if (error) {
			return NextResponse.json(
				{ error: `Error en la transcripción: ${error}` },
				{ status: 500 }
			);
		}

		// Asegurarse de que la transcripción sea una cadena de texto
		if (typeof transcription !== 'string') {
			return NextResponse.json(
				{ error: 'Invalid transcription format received' },
				{ status: 500 }
			);
		}

		return new Response(JSON.stringify({ transcription }), {
			status: 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
		});
	} catch (error) {
		console.error('Error en la solicitud de transcripción:', error);

		let errorMessage = 'Error al procesar la solicitud de transcripción';
		if (isAxiosError(error)) {
			if (error.code === 'ECONNABORTED') {
				errorMessage =
					'La solicitud tardó demasiado tiempo. Por favor, intenta de nuevo.';
			} else if (error.response) {
				const responseError = (error.response.data as { error?: string })
					?.error;
				errorMessage = `Error del servidor (${error.response.status}): ${responseError ?? error.message}`;
			} else if (error.request) {
				errorMessage =
					'No se pudo conectar con el servidor de transcripción. Por favor, verifica tu conexión a internet.';
			}
		}

		return new Response(JSON.stringify({ error: errorMessage }), {
			status: 500,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
		});
	}
}
