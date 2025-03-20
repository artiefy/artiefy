import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params;
		const { grade, comment }: { grade: number; comment: string } =
			(await request.json()) as { grade: number; comment: string };

		const key = `answer:${id}`;
		const existingAnswer = await redis.get(key);

		if (!existingAnswer) {
			return NextResponse.json(
				{ success: false, message: 'Respuesta no encontrada' },
				{ status: 404 }
			);
		}

		const updatedAnswer = { ...existingAnswer, grade, comment };
		await redis.set(key, updatedAnswer);

		return NextResponse.json({
			success: true,
			message: 'Calificación actualizada correctamente',
		});
	} catch (error) {
		console.error('Error al actualizar la calificación:', error);
		return NextResponse.json(
			{ success: false, message: 'Error al actualizar la calificación' },
			{ status: 500 }
		);
	}
}
