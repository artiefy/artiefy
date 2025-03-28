import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(
	_request: Request,
	{ params }: { params: { activityId: string } }
) {
	try {
		// Verificar autenticación
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
		}
		// Asegurarnos de que tenemos el activityId
		const { activityId } = params;
		if (!activityId) {
			return NextResponse.json(
				{ error: 'ID de actividad no proporcionado' },
				{ status: 400 }
			);
		}

		const activityIndex = `activity:${activityId}:submissions`;

		// Obtener todas las claves de archivos para esta actividad
		const submissionKeys = await redis.smembers(activityIndex);
		console.log('Claves de envíos:', submissionKeys); // Para debugging
		const respuestas: Record<string, {
			fileName: string;
			submittedAt: string;
			userId: string;
			userName: string;
			status: string;
			fileContent: string;
			grade: number | null;
		}> = {};

		for (const key of submissionKeys) {
			const fileDetails = await redis.hgetall(key);
			if (fileDetails) {
				respuestas[key] = {
					fileName: typeof fileDetails.fileName === 'string' ? fileDetails.fileName : '',
					submittedAt: typeof fileDetails.submittedAt === 'string' ? fileDetails.submittedAt : new Date().toISOString(),
					userId: typeof fileDetails.userId === 'string' ? fileDetails.userId : '',
					userName: typeof fileDetails.userName === 'string' ? fileDetails.userName : '',
					status: typeof fileDetails.status === 'string' ? fileDetails.status : 'pendiente',
					fileContent: typeof fileDetails.fileContent === 'string' ? fileDetails.fileContent : '',
					grade:
						fileDetails.grade && typeof fileDetails.grade === 'string'
							? parseFloat(fileDetails.grade)
							: null,
				};
			} else {
				console.log('No se encontraron detalles para la clave:', key); // Para debugging
			}
		}

		console.log('Respuestas recuperadas:', respuestas); // Para debugging
		return NextResponse.json({ respuestas });
	} catch (error) {
		console.error('Error al obtener respuestas:', error);
		return NextResponse.json(
			{ error: 'Error al obtener las respuestas' },
			{ status: 500 }
		);
	}
}
