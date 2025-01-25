'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, asc } from 'drizzle-orm';
import { db } from '~/server/db';
import {
	lessons,
	userLessonsProgress,
	userActivitiesProgress,
} from '~/server/db/schema';
import type { Lesson } from '~/types';

// Obtener todas las lecciones de un curso
export async function getLessonsByCourseId(
	courseId: number
): Promise<Lesson[]> {
	const user = await currentUser();
	if (!user?.id) {
		throw new Error('Usuario no autenticado');
	}

	const lessonsData = await db.query.lessons.findMany({
		where: eq(lessons.courseId, courseId),
		orderBy: [asc(lessons.order)],
		with: {
			activities: true,
		},
	});

	const userLessonsProgressData = await db.query.userLessonsProgress.findMany({
		where: eq(userLessonsProgress.userId, user.id),
	});

	const userActivitiesProgressData =
		await db.query.userActivitiesProgress.findMany({
			where: eq(userActivitiesProgress.userId, user.id),
		});

	let previousLessonCompleted = true; // Assume the first lesson is always unlocked

	return lessonsData.map((lesson, index) => {
		const lessonProgress = userLessonsProgressData.find(
			(progress) => progress.lessonId === lesson.id
		);

		const isLocked = index === 0 ? false : !previousLessonCompleted;

		const isCompleted = lessonProgress?.isCompleted ?? false;
		previousLessonCompleted = isCompleted;

		return {
			...lesson,
			porcentajecompletado: lessonProgress?.progress ?? 0,
			isLocked: isLocked,
			userProgress: lessonProgress?.progress ?? 0,
			isCompleted: isCompleted,
			activities:
				lesson.activities?.map((activity) => {
					const activityProgress = userActivitiesProgressData.find(
						(progress) => progress.activityId === activity.id
					);
					return {
						...activity,
						isCompleted: activityProgress?.isCompleted ?? false,
						userProgress: activityProgress?.progress ?? 0,
					};
				}) ?? [],
		};
	});
}
