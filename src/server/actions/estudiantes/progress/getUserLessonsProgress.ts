'use server';

import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import {
	userLessonsProgress,
	userActivitiesProgress,
} from '~/server/db/schema';
import type { UserLessonsProgress, UserActivitiesProgress } from '~/types';
import { unstable_cache } from 'next/cache';

// Obtener el progreso de las lecciones del usuario
const getUserLessonsProgress = unstable_cache(
	async (
		userId: string
	): Promise<{
		lessonsProgress: UserLessonsProgress[];
		activitiesProgress: UserActivitiesProgress[];
	}> => {
		try {
			const lessonsProgress = await db.query.userLessonsProgress.findMany({
				where: eq(userLessonsProgress.userId, userId),
			});

			const activitiesProgress = await db.query.userActivitiesProgress.findMany(
				{
					where: eq(userActivitiesProgress.userId, userId),
				}
			);

			return {
				lessonsProgress,
				activitiesProgress,
			};
		} catch (error) {
			console.error('Error fetching user lessons progress:', error);
			throw new Error(
				'Failed to fetch user lessons progress: ' +
					(error instanceof Error ? error.message : String(error))
			);
		}
	},
	['user-progress'],
	{ revalidate: 3600 }
);

export { getUserLessonsProgress };
