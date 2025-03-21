import { NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: Request) {
	try {
		const { activityId, questionId, userId, grade, submissionKey }: { activityId: string, questionId: string, userId: string, grade: number, submissionKey: string } =
			await request.json() as { activityId: string, questionId: string, userId: string, grade: number, submissionKey: string };

		if (
			!activityId ||
			!questionId ||
			!userId ||
			grade === undefined ||
			!submissionKey
		) {
			return NextResponse.json(
				{ error: 'Faltan datos requeridos' },
				{ status: 400 }
			);
		}

		// Obtener los datos actuales directamente usando la clave completa
		const currentData = await redis.hgetall(submissionKey);
		console.log('Datos actuales:', { submissionKey, currentData });

		if (!currentData) {
			return NextResponse.json(
				{ error: 'No se encontraron datos para la respuesta' },
				{ status: 404 }
			);
		}

		// Actualizar los datos manteniendo todos los campos existentes
		const updateData = {
			...currentData,
			grade: grade.toString(),
			status: 'calificado',
			lastUpdated: new Date().toISOString(),
		};

		// Actualizar los datos
		await redis.hset(submissionKey, updateData);

		// Verificar la actualización
		const updatedData = await redis.hgetall(submissionKey);
		console.log('Datos después de actualizar:', updatedData);

		if (!updatedData) {
			throw new Error('No se pudo verificar la actualización');
		}

		return NextResponse.json({
			success: true,
			data: updatedData,
		});
	} catch (error) {
		console.error('Error detallado al calificar:', error);
		return NextResponse.json(
			{
				error: 'Error al calificar la respuesta',
				details: error instanceof Error ? error.message : 'Error desconocido',
			},
			{ status: 500 }
		);
	}
}
