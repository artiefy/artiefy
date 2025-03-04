import { Redis } from '@upstash/redis';
import { type NextRequest, NextResponse } from 'next/server';
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

		const redisKey = `activity:${activityId}:user:${userId}:answers`;
		const savedData = await redis.get<ActivityResults>(redisKey);

		if (!savedData) {
			return NextResponse.json(
				{ error: 'No saved answers found' },
				{ status: 404 }
			);
		}

		return NextResponse.json(savedData);
	} catch (error) {
		console.error('Error fetching answers:', error);
		return NextResponse.json(
			{ error: 'Error fetching saved answers' },
			{ status: 500 }
		);
	}
}
