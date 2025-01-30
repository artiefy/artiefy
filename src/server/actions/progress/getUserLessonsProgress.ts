'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { userLessonsProgress } from '~/server/db/schema';
import type { UserLessonsProgress } from '~/types';

// Obtener el progreso de las lecciones del usuario
export async function getUserLessonsProgress(
	userId: string
): Promise<UserLessonsProgress[]> {
	try {
		const userLessonsProgressData = await db.query.userLessonsProgress.findMany(
			{
				where: eq(userLessonsProgress.userId, userId),
			}
		);

		return userLessonsProgressData;
	} catch (error) {
		console.error('Error fetching user lessons progress:', error);
		throw new Error(
			'Failed to fetch user lessons progress: ' +
				(error instanceof Error ? error.message : String(error))
		);
	}
}
