import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { eq, and } from 'drizzle-orm';

import { db } from '~/server/db';

import type { ActivityResults } from '~/types';

export const dynamic = 'force-dynamic';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const activityId = searchParams.get('activityId');
		const userId = searchParams.get('userId');

		if (!activityId || !userId) {
			return NextResponse.json(
				{ error: 'ActivityId and userId are required' },
				{ status: 400 }
			);
		}

		// First check activity details to get revisada status
		const activityKey = `activity:${activityId}`;
		const activity = await redis.get<{ revisada: boolean }>(activityKey);

		// First check activity completion in database
		const progress = await db.query.userActivitiesProgress.findFirst({
			where: (uap) =>
				and(eq(uap.activityId, parseInt(activityId)), eq(uap.userId, userId)),
		});

		// If we have progress record, return it even if not completed
		if (progress) {
			// Get saved results from Redis
			const resultsKey = `activity:${activityId}:user:${userId}:results`;
			const savedResults = await redis.get<ActivityResults>(resultsKey);

			return NextResponse.json({
				score: progress.finalGrade ?? 0,
				answers: savedResults?.answers ?? {},
				isAlreadyCompleted: progress.isCompleted,
				attemptCount: progress.attemptCount ?? 0,
				isRevisada: activity?.revisada ?? false,
				attemptsLimit: activity?.revisada ? 3 : null, // null indicates infinite attempts
			});
		}

		// If no record found at all
		return NextResponse.json(
			{ error: 'No activity progress found' },
			{ status: 404 }
		);
	} catch (error) {
		console.error('Error:', error);
		return NextResponse.json(
			{ error: 'Error fetching answers' },
			{ status: 500 }
		);
	}
}
