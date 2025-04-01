import { NextResponse, type NextRequest } from 'next/server';

import {
	getLessonById,
	updateLesson,
} from '~/models/educatorsModels/lessonsModels';

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const resolvedParams = await params;
		const LessonsId = parseInt(resolvedParams.id);
		if (isNaN(LessonsId)) {
			return NextResponse.json(
				{ error: 'ID de curso inválido' },
				{ status: 400 }
			);
		}

		const lesson = await getLessonById(LessonsId);
		if (!lesson) {
			return NextResponse.json(
				{ error: 'Curso no encontrado' },
				{ status: 404 }
			);
		}

		return NextResponse.json(lesson);
	} catch (error) {
		console.error('Error al obtener el curso:', error);
		return NextResponse.json(
			{ error: 'Error al obtener el curso' },
			{ status: 500 }
		);
	}
}

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const resolvedParams = await params;
		const lessonId = parseInt(resolvedParams.id);

		if (isNaN(lessonId)) {
			return new Response(JSON.stringify({ error: 'ID de lección inválido' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const data = (await req.json()) as {
			title?: string;
			description?: string;
			duration?: number;
			coverImageKey?: string;
			coverVideoKey?: string;
			resourceKey?: string;
			resourceNames?: string;
			courseId: number;
		};

		const updatedLesson = await updateLesson(lessonId, {
			title: data.title,
			description: data.description,
			duration: Number(data.duration),
			coverImageKey: data.coverImageKey,
			coverVideoKey: data.coverVideoKey,
			resourceKey: data.resourceKey,
			resourceNames: data.resourceNames,
			courseId: Number(data.courseId),
		});

		return new Response(JSON.stringify(updatedLesson), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error updating lesson:', error);
		return new Response(
			JSON.stringify({ error: 'Error al actualizar la lección' }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
}
