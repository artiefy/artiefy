import { NextResponse } from 'next/server';

import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { userLessonsProgress, lessons } from '~/server/db/schema';

// Define schema for request validation
const unlockRequestSchema = z.object({
	lessonId: z.number(),
	currentLessonId: z.number(),
	hasActivities: z.boolean(),
	allActivitiesCompleted: z.boolean(),
});

export async function POST(request: Request) {
	try {
		const user = await currentUser();
		if (!user?.id) {
			return NextResponse.json(
				{ success: false, error: 'Unauthorized' },
				{ status: 401 }
			);
		}

		// Parse and validate request data
		const requestBody = unlockRequestSchema.safeParse(await request.json());

		if (!requestBody.success) {
			return NextResponse.json(
				{ success: false, error: 'Invalid request data' },
				{ status: 400 }
			);
		}

		const { lessonId, currentLessonId, hasActivities, allActivitiesCompleted } =
			requestBody.data;

		// Validate that current lesson exists and is completed
		const currentLesson = await db.query.lessons.findFirst({
			where: eq(lessons.id, currentLessonId),
			with: {
				activities: true,
			},
		});

		if (!currentLesson) {
			return NextResponse.json(
				{ success: false, error: 'Current lesson not found' },
				{ status: 404 }
			);
		}

		// Check if the lesson should be unlocked based on activities
		const shouldUnlock = hasActivities ? allActivitiesCompleted : true;

		if (!shouldUnlock) {
			return NextResponse.json(
				{ success: false, error: 'Activities not completed' },
				{ status: 400 }
			);
		}

		// Proceed with unlocking
		await db
			.insert(userLessonsProgress)
			.values({
				userId: user.id,
				lessonId,
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

		return NextResponse.json({
			success: true,
			message: 'Lesson unlocked successfully',
		});
	} catch (error) {
		console.error(
			'Error unlocking lesson:',
			error instanceof Error ? error.message : 'Unknown error'
		);
		return NextResponse.json(
			{ success: false, error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
