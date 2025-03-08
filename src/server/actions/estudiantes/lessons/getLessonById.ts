'use server';

import { eq, and } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	lessons,
	userLessonsProgress,
	userActivitiesProgress,
} from '~/server/db/schema';

import type { Lesson, Activity } from '~/types';

export async function getLessonById(
	lessonId: number,
	userId: string
): Promise<Lesson | null> {
	try {
		const lesson = await db.query.lessons.findFirst({
			where: eq(lessons.id, lessonId),
			with: {
				activities: true,
			},
		});

		if (!lesson) return null;

		const lessonProgress = await db.query.userLessonsProgress.findFirst({
			where: and(
				eq(userLessonsProgress.userId, userId),
				eq(userLessonsProgress.lessonId, lessonId)
			),
		});

		const userActivitiesProgressData =
			await db.query.userActivitiesProgress.findMany({
				where: eq(userActivitiesProgress.userId, userId),
			});

		const transformedLesson: Lesson = {
			...lesson,
			porcentajecompletado: lessonProgress?.progress ?? 0,
			isLocked: lessonProgress?.isLocked ?? true,
			userProgress: lessonProgress?.progress ?? 0,
			isCompleted: lessonProgress?.isCompleted ?? false,
			resourceNames: lesson.resourceNames
				? lesson.resourceNames.split(',')
				: [], // Convertir texto a array
			activities:
				(lesson.activities as Activity[] | undefined)?.map((activity) => {
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

		return transformedLesson;
	} catch (error) {
		console.error('Error al obtener la lección por ID:', error);
		throw new Error('Error al obtener la lección por ID');
	}
}
