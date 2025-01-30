'use server';

import { currentUser } from '@clerk/nextjs/server';

import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';

// Completar una actividad
export async function completeActivity(activityId: number): Promise<void> {
	const user = await currentUser();
	if (!user?.id) {
		throw new Error('Usuario no autenticado');
	}

	const userId = user.id;

	await db
		.insert(userActivitiesProgress)
		.values({
			userId,
			activityId,
			progress: 100,
			isCompleted: true,
			lastUpdated: new Date(),
		})
		.onConflictDoUpdate({
			target: [
				userActivitiesProgress.userId,
				userActivitiesProgress.activityId,
			],
			set: {
				progress: 100,
				isCompleted: true,
				lastUpdated: new Date(),
			},
		});
}
