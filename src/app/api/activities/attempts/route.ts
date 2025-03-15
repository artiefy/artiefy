import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';

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

		const attemptsKey = `activity:${activityId}:user:${userId}:attempts`;
		const attempts = (await redis.get<number>(attemptsKey)) ?? 0;

		return NextResponse.json({ attempts });
	} catch (error) {
		console.error('Error fetching attempts:', error);
		return NextResponse.json(
			{ error: 'Error fetching attempts' },
			{ status: 500 }
		);
	}
}
