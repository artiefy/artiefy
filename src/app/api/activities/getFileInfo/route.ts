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
				{ error: 'Missing required parameters' },
				{ status: 400 }
			);
		}

		const redisKey = `activity:${activityId}:user:${userId}:file`;
		const fileInfo = await redis.get(redisKey);

		if (!fileInfo) {
			return NextResponse.json({ error: 'File not found' }, { status: 404 });
		}

		return NextResponse.json(fileInfo);
	} catch (error) {
		console.error('Error fetching file info:', error);
		return NextResponse.json(
			{ error: 'Error fetching file info' },
			{ status: 500 }
		);
	}
}
