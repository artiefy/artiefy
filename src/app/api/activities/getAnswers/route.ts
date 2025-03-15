import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { eq, and } from 'drizzle-orm';

import { db } from '~/server/db';

import type { ActivityResults } from '~/types';

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

		// First check activity completion in database
		const progress = await db.query.userActivitiesProgress.findFirst({
			where: (uap) =>
				and(eq(uap.activityId, parseInt(activityId)), eq(uap.userId, userId)),
		});

		// Get saved results from Redis
		const resultsKey = `activity:${activityId}:user:${userId}:results`;
		const savedResults = await redis.get<ActivityResults>(resultsKey);

		// If activity is completed in DB and we have Redis results, return them
		if (progress?.isCompleted && savedResults) {
			return NextResponse.json({
				score: progress.finalGrade ?? savedResults.score,
				answers: savedResults.answers,
				isAlreadyCompleted: true,
				attemptCount: progress.attemptCount ?? 0,
			});
		}

		// If we have progress but no Redis results, check answers key
		const answersKey = `activity:${activityId}:user:${userId}:answers`;
		const savedAnswers = await redis.get(answersKey);

		if (progress?.isCompleted && savedAnswers) {
			return NextResponse.json({
				score: progress.finalGrade ?? 0,
				answers: savedAnswers,
				isAlreadyCompleted: true,
				attemptCount: progress.attemptCount ?? 0,
			});
		}

		// If no completion record found
		return NextResponse.json(
			{ error: 'No saved answers found' },
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
