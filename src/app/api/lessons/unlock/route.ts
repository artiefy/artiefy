import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

import { db } from '~/server/db';
import { userLessonsProgress, activities } from '~/server/db/schema';

interface UnlockRequestBody {
	lessonId: number;
	currentLessonId: number;
}

function isValidUnlockRequest(data: unknown): data is UnlockRequestBody {
	if (!data || typeof data !== 'object') return false;
	return (
		'lessonId' in data &&
		typeof (data as UnlockRequestBody).lessonId === 'number' &&
		'currentLessonId' in data &&
		typeof (data as UnlockRequestBody).currentLessonId === 'number'
	);
}

export async function POST(req: Request) {
	try {
		const authData = await auth();
		if (!authData?.userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		let parsedBody: unknown;
		try {
			parsedBody = await req.json();
		} catch (e) {
			return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
		}

		if (!isValidUnlockRequest(parsedBody)) {
			return NextResponse.json(
				{ error: 'Invalid request body' },
				{ status: 400 }
			);
		}

		const { lessonId, currentLessonId } = parsedBody;

		// Verify current lesson is complete
		const currentProgress = await db.query.userLessonsProgress.findFirst({
			where: and(
				eq(userLessonsProgress.lessonId, currentLessonId),
				eq(userLessonsProgress.userId, authData.userId)
			),
		});

		if (!currentProgress || currentProgress.progress < 100) {
			return NextResponse.json(
				{ error: 'Current lesson not completed' },
				{ status: 400 }
			);
		}

		// Get activities for current lesson
		const lessonActivities = await db.query.activities.findMany({
			where: eq(activities.lessonsId, currentLessonId),
		});

		// Check if all activities are completed (if any exist)
		if (lessonActivities.length > 0) {
			const activitiesProgress = await db.query.userActivitiesProgress.findMany(
				{
					where: and(eq(userLessonsProgress.userId, authData.userId)),
				}
			);

			const allActivitiesCompleted = lessonActivities.every((activity) =>
				activitiesProgress.some(
					(progress) =>
						progress.activityId === activity.id && progress.isCompleted
				)
			);

			if (!allActivitiesCompleted) {
				return NextResponse.json(
					{ error: 'Not all activities completed' },
					{ status: 400 }
				);
			}
		}

		// Update or insert progress record for next lesson
		const result = await db
			.insert(userLessonsProgress)
			.values({
				userId: authData.userId,
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
			result,
		});
	} catch (error) {
		console.error('Error unlocking lesson:', error);
		return NextResponse.json(
			{ error: 'Failed to unlock lesson' },
			{ status: 500 }
		);
	}
}
