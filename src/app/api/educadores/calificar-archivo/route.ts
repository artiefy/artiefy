import { NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';

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
			return NextResponse.json(
				{ error: 'Faltan datos requeridos' },
				{ status: 400 }
			);
		}

		const cleanedKey = submissionKey.trim();
		console.log('🔑 Clave usada para Redis:', cleanedKey);

		const raw = await redis.get(cleanedKey);
		console.log('📦 Datos actuales (raw):', raw);

		if (!raw || typeof raw !== 'object') {
			return NextResponse.json(
				{ error: 'No se encontraron datos para la respuesta' },
				{ status: 404 }
			);
		}

		const parsed = { ...raw } as Record<string, unknown>;
		parsed.grade = grade;
		parsed.status = 'reviewed';
		parsed.lastUpdated = new Date().toISOString();

		await redis.set(cleanedKey, parsed);
		console.log('✅ Redis actualizado:', parsed);

		// ✅ ACTUALIZAR revisada, nota, y fecha en userActivitiesProgress
		await db
			.update(userActivitiesProgress)
			.set({
				finalGrade: grade,
				revisada: true,
				lastAttemptAt: new Date(),
			})
			.where(
				eq(userActivitiesProgress.userId, userId) &&
					eq(userActivitiesProgress.activityId, Number(activityId))
			);

		console.log('📝 BD actualizada: finalGrade, revisada, lastAttemptAt');

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
