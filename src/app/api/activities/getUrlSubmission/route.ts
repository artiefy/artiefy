import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';

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

    // Get URL submission info from Redis
    const submissionKey = `activity:${activityId}:user:${userId}:urlsubmission`;
    const submission = await redis.get(submissionKey);

    // Get progress info from database
    const progress = await db.query.userActivitiesProgress.findFirst({
      where: and(
        eq(userActivitiesProgress.activityId, parseInt(activityId)),
        eq(userActivitiesProgress.userId, userId)
      ),
    });

    const response = {
      submission,
      progress,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting URL submission:', error);
    return NextResponse.json(
      { error: 'Error retrieving URL submission' },
      { status: 500 }
    );
  }
}
