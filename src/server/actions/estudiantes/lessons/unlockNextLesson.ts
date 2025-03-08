'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, and, gt, asc } from 'drizzle-orm';

import { db } from '~/server/db';
import { userLessonsProgress, lessons } from '~/server/db/schema';

export async function unlockNextLesson(
	currentLessonId: number
): Promise<{ success: boolean; nextLessonId?: number }> {
	try {
		const user = await currentUser();
		if (!user?.id) throw new Error('Usuario no autenticado');

		// 1. Marcar lección actual como completada
		await db
			.update(userLessonsProgress)
			.set({
				isCompleted: true,
				progress: 100,
				isLocked: false,
				lastUpdated: new Date(),
			})
			.where(
				and(
					eq(userLessonsProgress.userId, user.id),
					eq(userLessonsProgress.lessonId, currentLessonId)
				)
			);

		// 2. Obtener la siguiente lección
		const currentLesson = await db.query.lessons.findFirst({
			where: eq(lessons.id, currentLessonId),
		});

		if (!currentLesson) throw new Error('Lección actual no encontrada');

		const nextLesson = await db.query.lessons.findFirst({
			where: and(
				eq(lessons.courseId, currentLesson.courseId),
				gt(lessons.title, currentLesson.title)
			),
			orderBy: asc(lessons.title),
		});

		if (!nextLesson) {
			return { success: false };
		}

		// 3. Crear o actualizar el progreso de la siguiente lección
		await db
			.insert(userLessonsProgress)
			.values({
				userId: user.id,
				lessonId: nextLesson.id,
				progress: 0,
				isCompleted: false,
				isLocked: false,
				lastUpdated: new Date(),
			})
			.onConflictDoUpdate({
				target: [userLessonsProgress.userId, userLessonsProgress.lessonId],
				set: {
					isLocked: false,
					progress: 0,
					isCompleted: false,
					lastUpdated: new Date(),
				},
			});

		return { success: true, nextLessonId: nextLesson.id };
	} catch (error) {
		console.error('Error unlocking next lesson:', error);
		return { success: false };
	}
}
