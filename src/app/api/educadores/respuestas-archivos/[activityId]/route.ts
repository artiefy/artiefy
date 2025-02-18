import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(
	request: Request,
	{ params }: { params: { activityId: string } }
) {
	try {
		// Verificar autenticación
		const userId = auth();
		if (!userId) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
		}

		// Asegurarnos de que tenemos el activityId
		if (!params?.activityId) {
			return NextResponse.json(
				{ error: 'ID de actividad no proporcionado' },
				{ status: 400 }
			);
		}

		const activityId = params.activityId;
		const activityIndex = `activity:${activityId}:submissions`;

		// Obtener todas las claves de archivos para esta actividad
		const submissionKeys = await redis.smembers(activityIndex);

		// Obtener los detalles de cada archivo
		const respuestas: Record<string, any> = {};

		for (const key of submissionKeys) {
			const fileDetails = await redis.hgetall(key);
			if (fileDetails) {
				respuestas[key] = {
					fileName: fileDetails.fileName,
					submittedAt: fileDetails.submittedAt,
					userId: fileDetails.userId,
					userName: fileDetails.userName,
					status: fileDetails.status,
					grade: fileDetails.grade ? Number(fileDetails.grade) : null,
				};
			}
		}

		return NextResponse.json({ respuestas });
	} catch (error) {
		console.error('Error al obtener respuestas:', error);
		return NextResponse.json(
			{ error: 'Error al obtener las respuestas' },
			{ status: 500 }
		);
	}
}
