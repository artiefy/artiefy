'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

import { db } from '~/server/db';
import { lessons, userLessonsProgress } from '~/server/db/schema';

// Desbloquear la siguiente lección
export async function unlockNextLesson(
	currentLessonId: number
): Promise<{ success: boolean; nextLessonId?: number }> {
	const user = await currentUser();
	if (!user?.id) {
		throw new Error('Usuario no autenticado');
	}

	// Verify if the current lesson is completed (video and activity)
	const currentLessonProgress = await db.query.userLessonsProgress.findFirst({
		where: and(
			eq(userLessonsProgress.userId, user.id),
			eq(userLessonsProgress.lessonId, currentLessonId)
		),
	});

	if (!currentLessonProgress?.isCompleted) {
		return { success: false };
	}

	const currentLesson = await db.query.lessons.findFirst({
		where: eq(lessons.id, currentLessonId),
	});

	if (!currentLesson) {
		throw new Error('Lección actual no encontrada');
	}

	const nextLesson = await db.query.lessons.findFirst({
		where: and(
			eq(lessons.courseId, currentLesson.courseId),
			eq(lessons.order, currentLesson.order + 1)
		),
	});

	if (nextLesson) {
		await db
			.insert(userLessonsProgress)
			.values({
				userId: user.id,
				lessonId: nextLesson.id,
				progress: 1,
				isCompleted: false,
				isLocked: false,
				lastUpdated: new Date(),
			})
			.onConflictDoUpdate({
				target: [userLessonsProgress.userId, userLessonsProgress.lessonId],
				set: {
					isLocked: false,
					progress: 1,
					lastUpdated: new Date(),
				},
			});

		return { success: true, nextLessonId: nextLesson.id };
	}

	return { success: false };
}
