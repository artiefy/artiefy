'use server';

import { Redis } from '@upstash/redis';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function saveActivityScore(
	activityId: string,
	userId: string,
	score: number
): Promise<void> {
	try {
		const scoreKey = `activity:${activityId}:user:${userId}:score`;
		await redis.set(scoreKey, score);
		console.log(
			`Score for activity ${activityId} and user ${userId} saved successfully.`
		);
	} catch (error) {
		console.error('Error saving activity score:', error);
	}
}
