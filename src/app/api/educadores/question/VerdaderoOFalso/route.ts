import { Redis } from '@upstash/redis';
import { type NextRequest, NextResponse } from 'next/server';
import type { VerdaderoOFlaso } from '~/types/typesActi';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const activityId = searchParams.get('activityId');
		if (!activityId) {
			return NextResponse.json(
				{ success: false, message: 'Se requiere activityId' },
				{ status: 400 }
			);
		}
		const key = `activity:${activityId}:questionsVOF`;
		const questionsVOF = (await redis.get<VerdaderoOFlaso[]>(key)) ?? [];
		return NextResponse.json({ success: true, questionsVOF: questionsVOF });
	} catch (error) {
		console.error('Error en la API route:', error);
		return NextResponse.json(
			{ success: false, message: 'Error en el servidor' },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const { activityId, questionsVOF } = (await request.json()) as {
			activityId: string;
			questionsVOF: VerdaderoOFlaso;
		};

		if (!activityId || !questionsVOF) {
			return NextResponse.json(
				{ success: false, message: 'Datos incompletos' },
				{ status: 400 }
			);
		}

		const key = `activity:${activityId}:questionsVOF`;
		const existingQuestions = (await redis.get<VerdaderoOFlaso[]>(key)) ?? [];

		const updatedQuestions = [...existingQuestions, questionsVOF];
		await redis.set(key, updatedQuestions);
		return NextResponse.json({
			success: true,
			message: 'Pregunta guardada correctamente',
		});
	} catch (error) {
		console.error('Error al guardar la pregunta:', error);
		return NextResponse.json(
			{ success: false, message: 'Error al guardar la pregunta' },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const { activityId, questionsVOF } = (await request.json()) as {
			activityId: string;
			questionsVOF: VerdaderoOFlaso;
		};

		if (!activityId || !questionsVOF) {
			return NextResponse.json(
				{ success: false, message: 'Datos incompletos' },
				{ status: 400 }
			);
		}

		const key = `activity:${activityId}:questionsVOF`;
		const existingQuestions = (await redis.get<VerdaderoOFlaso[]>(key)) ?? [];

		const updatedQuestions = existingQuestions.map((q) =>
			q.id === questionsVOF.id ? questionsVOF : q
		);
		await redis.set(key, updatedQuestions);
		return NextResponse.json({
			success: true,
			message: 'Pregunta actualizada correctamente',
		});
	} catch (error) {
		console.error('Error al actualizar la pregunta:', error);
		return NextResponse.json(
			{ success: false, message: 'Error al actualizar la pregunta' },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const activityId = searchParams.get('activityId');
		const questionId = searchParams.get('questionId');
		if (!activityId || !questionId) {
			return NextResponse.json(
				{ success: false, message: 'Se requieren activityId y questionId' },
				{ status: 400 }
			);
		}
		const key = `activity:${activityId}:questionsVOF`;
		const existingQuestions = (await redis.get<VerdaderoOFlaso[]>(key)) ?? [];
		const updatedQuestions = existingQuestions.filter(
			(q) => q.id !== questionId
		);
		await redis.set(key, updatedQuestions);
		return NextResponse.json({
			success: true,
			message: 'Pregunta eliminada correctamente',
		});
	} catch (error) {
		console.error('Error al eliminar la pregunta:', error);
		return NextResponse.json(
			{ success: false, message: 'Error al eliminar la pregunta' },
			{ status: 500 }
		);
	}
}
