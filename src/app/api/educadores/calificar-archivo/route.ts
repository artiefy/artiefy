import { NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface CalificacionPayload {
	activityId: string;
	questionId: string;
	userId: string;
	grade: number;
	submissionKey: string;
}

export async function POST(request: Request) {
	try {
		const payload = (await request.json()) as CalificacionPayload;
		const { activityId, questionId, userId, grade, submissionKey } = payload;

		console.log('📨 Payload recibido:', payload);

		if (
			!activityId?.trim() ||
			!questionId?.trim() ||
			!userId?.trim() ||
			grade === undefined ||
			!submissionKey?.trim()
		) {
			console.warn('❌ Datos incompletos en payload');
			return NextResponse.json(
				{ error: 'Faltan datos requeridos' },
				{ status: 400 }
			);
		}

		const cleanedKey = submissionKey.trim();
		console.log('🔑 Clave usada para Redis:', cleanedKey);

		// 🚨 Este es el punto clave:
		const raw = await redis.get(cleanedKey);
		console.log('📦 Datos actuales (raw):', raw);

		if (!raw || typeof raw !== 'object') {
			console.warn(
				'⚠️ No se encontraron datos o tipo incorrecto para la clave'
			);
			return NextResponse.json(
				{ error: 'No se encontraron datos para la respuesta' },
				{ status: 404 }
			);
		}

		// Ya que viene como objeto, no hay que parsear, solo modificar
		const parsed = { ...raw } as Record<string, unknown>;

		parsed.grade = grade;
		parsed.status = 'reviewed';
		parsed.lastUpdated = new Date().toISOString();

		await redis.set(cleanedKey, parsed); // ← directo como objeto, Redis lo serializa

		console.log('✅ Datos después de actualizar:', parsed);

		return NextResponse.json({ success: true, data: parsed });
	} catch (error) {
		console.error('💥 Error al calificar:', error);
		return NextResponse.json(
			{
				error: 'Error al calificar la respuesta',
				details: error instanceof Error ? error.message : 'Error desconocido',
			},
			{ status: 500 }
		);
	}
}
