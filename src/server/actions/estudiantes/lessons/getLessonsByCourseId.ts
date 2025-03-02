'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, asc } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from '~/server/db';
import {
	lessons,
	userLessonsProgress,
	userActivitiesProgress,
} from '~/server/db/schema';
import type { Lesson } from '~/types';

export const getLessonsByCourseId = unstable_cache(
	async (courseId: number): Promise<Lesson[]> => {
		const user = await currentUser();
		if (!user?.id) {
			throw new Error('Usuario no autenticado');
		}

		const lessonsData = await db.query.lessons.findMany({
			where: eq(lessons.courseId, courseId),
			orderBy: [asc(lessons.title)], // ✅ Asegurar orden ascendente por título
			with: {
				activities: true,
			},
		});

		const userLessonsProgressData = await db.query.userLessonsProgress.findMany(
			{
				where: eq(userLessonsProgress.userId, user.id),
			}
		);

		const userActivitiesProgressData =
			await db.query.userActivitiesProgress.findMany({
				where: eq(userActivitiesProgress.userId, user.id),
			});

		// 🔥 Extra: Normalizar los títulos antes de ordenarlos
		const sortedLessons = lessonsData.sort((a, b) => {
			return a.title.trim().localeCompare(b.title.trim(), 'es', {
				numeric: true, // Ordenar números correctamente (Clase 1, Clase 2...)
			});
		});

		return sortedLessons.map((lesson) => {
			const lessonProgress = userLessonsProgressData.find(
				(progress) => progress.lessonId === lesson.id
			);

			return {
				...lesson,
				porcentajecompletado: lessonProgress?.progress ?? 0,
				isLocked: lessonProgress?.isLocked ?? true,
				userProgress: lessonProgress?.progress ?? 0,
				resourceNames: lesson.resourceNames
					? lesson.resourceNames.split(',')
					: [], // Convertir texto a array
				isCompleted: lessonProgress?.isCompleted ?? false,
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
	},
	['course-lessons'],
	{ revalidate: 3600 }
);
