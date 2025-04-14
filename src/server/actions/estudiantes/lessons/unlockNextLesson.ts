'use server';

import { revalidatePath } from 'next/cache';

import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { userLessonsProgress, lessons } from '~/server/db/schema';

function extractNumberFromTitle(title: string): number {
	const match = /\d+/.exec(title);
	return match ? parseInt(match[0], 10) : 0;
}

export async function unlockNextLesson(
	currentLessonId: number
): Promise<{ success: boolean; nextLessonId?: number }> {
	try {
		const user = await currentUser();
		if (!user?.id) throw new Error('Usuario no autenticado');

		// Get current lesson and its activity status
		const currentLesson = await db.query.lessons.findFirst({
			where: eq(lessons.id, currentLessonId),
			with: {
				activities: true,
			},
		});

		if (!currentLesson?.courseId) {
			return { success: false };
		}

		// Get all lessons for the course
		const courseLessons = await db.query.lessons.findMany({
			where: eq(lessons.courseId, currentLesson.courseId),
		});

		// Sort lessons by numeric value in title
		const sortedLessons = courseLessons.sort(
			(a, b) =>
				extractNumberFromTitle(a.title) - extractNumberFromTitle(b.title)
		);

		// Find current lesson index
		const currentIndex = sortedLessons.findIndex(
			(l) => l.id === currentLessonId
		);
		const nextLesson = sortedLessons[currentIndex + 1];

		if (!nextLesson) {
			return { success: false };
		}

		// Update progress for next lesson
		await db
			.insert(userLessonsProgress)
			.values({
				userId: user.id,
				lessonId: nextLesson.id,
				progress: 0,
				isCompleted: false,
				isLocked: false,
				isNew: true,
				lastUpdated: new Date(),
			})
			.onConflictDoUpdate({
				target: [userLessonsProgress.userId, userLessonsProgress.lessonId],
				set: {
					isLocked: false,
					isNew: true,
					lastUpdated: new Date(),
				},
			});

		revalidatePath('/estudiantes/clases/[id]', 'page');

		return {
			success: true,
			nextLessonId: nextLesson.id,
		};
	} catch (error) {
		console.error('Error unlocking next lesson:', error);
		return { success: false };
	}
}