'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	lessons,
	userLessonsProgress,
	userActivitiesProgress,
} from '~/server/db/schema';
import type { Lesson, Activity } from '~/types';

// Obtener una lección específica por ID
export async function getLessonById(lessonId: number): Promise<Lesson | null> {
	try {
		const user = await currentUser();
		if (!user?.id) {
			throw new Error('Usuario no autenticado');
		}

		const lesson = await db.query.lessons.findFirst({
			where: eq(lessons.id, lessonId),
			with: {
				activities: true,
			},
		});
		if (!lesson) return null;

		const lessonProgress = await db.query.userLessonsProgress.findFirst({
			where: and(
				eq(userLessonsProgress.userId, user.id),
				eq(userLessonsProgress.lessonId, lessonId)
			),
		});

		const userActivitiesProgressData =
			await db.query.userActivitiesProgress.findMany({
				where: eq(userActivitiesProgress.userId, user.id),
			});

		return {
			...lesson,
			porcentajecompletado: lessonProgress?.progress ?? 0,
			isLocked: lessonProgress?.isLocked ?? true,
			userProgress: lessonProgress?.progress ?? 0,
			isCompleted: lessonProgress?.isCompleted ?? false,
			activities:
				(lesson.activities as unknown as Activity[] | undefined)?.map(
					(activity) => {
						const activityProgress = userActivitiesProgressData.find(
							(progress) => progress.activityId === activity.id
						);
						return {
							...activity,
							isCompleted: activityProgress?.isCompleted ?? false,
							userProgress: activityProgress?.progress ?? 0,
						};
					}
				) ?? [],
		};
	} catch (error) {
		console.error('Error al obtener la lección por ID:', error);
		throw new Error('Error al obtener la lección por ID');
	}
}
