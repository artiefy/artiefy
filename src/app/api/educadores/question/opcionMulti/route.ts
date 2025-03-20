import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';

import type { Question } from '~/types/typesActi';

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
		const key = `activity:${activityId}:questionsOM`;
		const questionsOM = (await redis.get<Question[]>(key)) ?? [];
		return NextResponse.json({ success: true, questionsOM });
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
		const { activityId, questionsOM } = (await request.json()) as {
			activityId: string;
			questionsOM: Question;
		};

		if (!activityId || !questionsOM) {
			return NextResponse.json(
				{ success: false, message: 'Datos incompletos' },
				{ status: 400 }
			);
		}

		const key = `activity:${activityId}:questionsOM`;
		const existingQuestions = (await redis.get<Question[]>(key)) ?? [];

		const updatedQuestions = [...existingQuestions, questionsOM];
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
		const { activityId, questionsOM } = (await request.json()) as {
			activityId: string;
			questionsOM: Question;
		};

		if (!activityId || !questionsOM) {
			return NextResponse.json(
				{ success: false, message: 'Datos incompletos' },
				{ status: 400 }
			);
		}

		const key = `activity:${activityId}:questionsOM`;
		const existingQuestions = (await redis.get<Question[]>(key)) ?? [];

		const updatedQuestions = existingQuestions.map((q) =>
			q.id === questionsOM.id ? questionsOM : q
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
		const key = `activity:${activityId}:questionsOM`;
		const existingQuestions = (await redis.get<Question[]>(key)) ?? [];
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
