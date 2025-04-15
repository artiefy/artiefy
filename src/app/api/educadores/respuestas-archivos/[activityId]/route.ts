import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface Pregunta {
	id: string;
	text: string;
	parametros?: string;
	pesoPregunta?: number;
}

interface RawSubmission {
	fileName?: unknown;
	submittedAt?: unknown;
	userId?: unknown;
	userName?: unknown;
	status?: unknown;
	fileContent?: unknown;
	grade?: unknown;
}

interface Respuesta {
	fileName: string;
	submittedAt: string;
	userId: string;
	userName: string;
	status: string;
	fileContent: string;
	grade: number | null;
}

export async function GET(request: NextRequest) {
	const url = new URL(request.url);
	const activityId = url.pathname.split('/').pop();

	if (!activityId) {
		return NextResponse.json(
			{ error: 'Falta el ID de actividad' },
			{ status: 400 }
		);
	}

	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
	}

	let preguntas: Pregunta[] = [];

	try {
		const rawPreguntas = await redis.get(
			`activity:${activityId}:questionsFilesSubida`
		);

		if (typeof rawPreguntas === 'string') {
			preguntas = JSON.parse(rawPreguntas) as Pregunta[];
		} else if (Array.isArray(rawPreguntas)) {
			preguntas = rawPreguntas as Pregunta[];
		} else {
			return NextResponse.json(
				{ error: 'Preguntas no válidas' },
				{ status: 500 }
			);
		}

		console.log('📋 Preguntas cargadas:', preguntas);
	} catch (error) {
		console.error('❌ Error parseando preguntas:', error);
		return NextResponse.json(
			{ error: 'Error en formato de preguntas' },
			{ status: 500 }
		);
	}

	const respuestas: Record<string, Respuesta> = {};

	try {
		const allKeys = await redis.keys(`activity:${activityId}:user:*:submission`);
		console.log('🗝️ Claves encontradas:', allKeys);

		for (const key of allKeys) {
			console.log(`📂 Procesando clave: ${key}`);

			const rawDoc = await redis.get<RawSubmission>(key);

			if (!rawDoc || typeof rawDoc !== 'object' || Array.isArray(rawDoc)) {
				console.log('📭 Documento vacío o no válido para clave:', key);
				continue;
			}

			const questionIdInKey = preguntas[0]?.id.trim(); // solo si manejas una pregunta
			console.log('🎯 ID de pregunta extraído:', questionIdInKey);

			const match = preguntas.some((p) => p.id.trim() === questionIdInKey);
			preguntas.forEach((p) => {
				console.log(`🧪 Comparando: "${p.id.trim()}" === "${questionIdInKey}"`);
			});

			if (!match) {
				console.log('❌ No matchea pregunta:', questionIdInKey);
				continue;
			}

			const fileName =
				typeof rawDoc.fileName === 'string' ? rawDoc.fileName : '';
			const submittedAt =
				typeof rawDoc.submittedAt === 'string'
					? rawDoc.submittedAt
					: new Date().toISOString();
			const fileContent =
				typeof rawDoc.fileContent === 'string' ? rawDoc.fileContent : '';
			const status =
				typeof rawDoc.status === 'string' ? rawDoc.status : 'pendiente';
			const userIdFromKey =
				typeof rawDoc.userId === 'string' ? rawDoc.userId : key.split(':')[2];
			const userName =
				typeof rawDoc.userName === 'string' ? rawDoc.userName : userIdFromKey;

			let grade: number | null = null;
			if (typeof rawDoc.grade === 'number') {
				grade = rawDoc.grade;
			} else if (
				typeof rawDoc.grade === 'string' &&
				!isNaN(Number(rawDoc.grade))
			) {
				grade = Number(rawDoc.grade);
			}

			respuestas[key] = {
				fileName,
				submittedAt,
				userId: userIdFromKey,
				userName,
				status,
				fileContent,
				grade,
			};
		}
	} catch (err) {
		console.error('❌ Error procesando respuestas:', err);
	}

	console.log(
		'✅ Total respuestas encontradas:',
		Object.keys(respuestas).length
	);

	return NextResponse.json({ respuestas });
}
