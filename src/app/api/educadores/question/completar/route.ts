import { Redis } from '@upstash/redis';
import { type NextRequest, NextResponse } from 'next/server';
import type { Completado } from '~/types/typesActi';

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
		const key = `activity:${activityId}:questions`;
		const questions = (await redis.get<Completado[]>(key)) ?? [];
		console.log(questions);
		return NextResponse.json({ success: true, questions });
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
		const { activityId, questions } = (await request.json()) as {
			activityId: string;
			questions: Completado;
		};
		if (!activityId || !questions) {
			return NextResponse.json(
				{ success: false, message: 'Se requieren activityId y questions' },
				{ status: 400 }
			);
		}
		const key = `activity:${activityId}:questions`;
		const existingQuestions = (await redis.get<Completado[]>(key)) ?? [];

		const updatedQuestions = [...existingQuestions, questions];
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
		const { activityId, questions } = (await request.json()) as {
			activityId: string;
			questions: Completado;
		};
		if (!activityId || !questions) {
			return NextResponse.json(
				{ success: false, message: 'Se requieren activityId y questions' },
				{ status: 400 }
			);
		}
		const key = `activity:${activityId}:questions`;
		const existingQuestions = (await redis.get<Completado[]>(key)) ?? [];

		const updatedQuestions = existingQuestions.map((q) =>
			q?.id === questions.id ? questions : q
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
		const key = `activity:${activityId}:questions`;
		const existingQuestions = (await redis.get<Completado[]>(key)) ?? [];
		const updatedQuestions = existingQuestions.filter(
			(q) => q && q.id !== questionId
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
