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
	uploadDate?: unknown; // Added the missing property
	fileUrl?: unknown; // Added the missing property
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

	// ✅ Cargar preguntas (si existen)
	let preguntas: Pregunta[] = [];
	try {
		const rawPreguntas = await redis.get(
			`activity:${activityId}:questionsFilesSubida`
		);
		console.log('🧾 rawPreguntas:', rawPreguntas);

		if (typeof rawPreguntas === 'string') {
			preguntas = JSON.parse(rawPreguntas);
		} else if (Array.isArray(rawPreguntas)) {
			preguntas = rawPreguntas;
		} else {
			console.warn('⚠️ No hay preguntas definidas para esta actividad.');
		}
	} catch (error) {
		console.error('❌ Error al cargar preguntas:', error);
		// No se lanza error, continúa con respuestas
	}

	// ✅ Cargar respuestas
	const respuestas: Record<string, Respuesta> = {};

	try {
		const allKeys = await redis.keys(
			`activity:${activityId}:user:*:submission`
		);
		console.log('🗝️ Claves encontradas:', allKeys.length, allKeys);

		for (const key of allKeys) {
			const rawDoc = await redis.get<RawSubmission>(key);

			if (!rawDoc || typeof rawDoc !== 'object' || Array.isArray(rawDoc)) {
				console.log('📭 Documento vacío o inválido:', key);
				continue;
			}

			const fileName =
				typeof rawDoc.fileName === 'string' ? rawDoc.fileName : '';
			const submittedAt =
				typeof rawDoc.uploadDate === 'string'
					? rawDoc.uploadDate
					: new Date().toISOString();
			const fileContent =
				typeof rawDoc.fileUrl === 'string' ? rawDoc.fileUrl : '';
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
	} catch (error) {
		console.error('❌ Error al cargar respuestas:', error);
		return NextResponse.json(
			{ error: 'Error interno al procesar las respuestas' },
			{ status: 500 }
		);
	}

	console.log(
		'✅ Total respuestas encontradas:',
		Object.keys(respuestas).length
	);
	return NextResponse.json({ respuestas, preguntas });
}
