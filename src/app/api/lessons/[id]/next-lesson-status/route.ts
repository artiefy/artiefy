import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { lessons, userLessonsProgress } from '~/server/db/schema';

interface NextLessonStatusResponse {
	lessonId: number | null;
	isUnlocked: boolean;
	error?: string;
}

export async function GET(
	_request: Request,
	{ params }: { params: { id: string } }
): Promise<NextResponse<NextLessonStatusResponse>> {
	try {
		if (!params?.id) {
			return NextResponse.json({
				lessonId: null,
				isUnlocked: false,
				error: 'ID no proporcionado',
			});
		}

		const currentLessonId = Number(params.id);
		if (isNaN(currentLessonId)) {
			return NextResponse.json({
				lessonId: null,
				isUnlocked: false,
				error: 'ID inválido',
			});
		}

		const currentLesson = await db.query.lessons.findFirst({
			where: eq(lessons.id, currentLessonId),
			with: {
				activities: true,
			},
		});

		if (!currentLesson) {
			return NextResponse.json({ lessonId: null, isUnlocked: false });
		}

		// Get next lesson with its progress
		const nextLesson = await db.query.lessons.findFirst({
			where: eq(lessons.courseId, currentLesson.courseId),
			orderBy: (lessons, { asc }) => [asc(lessons.id)],
		});

		if (!nextLesson) {
			return NextResponse.json({ lessonId: null, isUnlocked: false });
		}

		// Get lesson progress
		const progress = await db.query.userLessonsProgress.findFirst({
			where: eq(userLessonsProgress.lessonId, nextLesson.id),
		});

		return NextResponse.json({
			lessonId: nextLesson.id,
			isUnlocked: progress?.isLocked === false,
		});
	} catch (error) {
		return NextResponse.json({
			lessonId: null,
			isUnlocked: false,
			error: 'Error interno del servidor',
		});
	}
}
