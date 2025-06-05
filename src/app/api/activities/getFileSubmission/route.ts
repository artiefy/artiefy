import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { eq, and } from 'drizzle-orm';

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

    // Get submission from Redis
    const submissionKey = `activity:${activityId}:user:${userId}:submission`;
    const submission = await redis.get(submissionKey);

    // Get progress from database
    const progress = await db.query.userActivitiesProgress.findFirst({
      where: and(
        eq(userActivitiesProgress.userId, userId),
        eq(userActivitiesProgress.activityId, parseInt(activityId))
      ),
    });

    return NextResponse.json({
      submission,
      progress: progress
        ? {
            isCompleted: progress.isCompleted,
            grade: progress.finalGrade,
          }
        : null,
    });
  } catch (error) {
    console.error('Error getting submission:', error);
    return NextResponse.json(
      { error: 'Error retrieving submission' },
      { status: 500 }
    );
  }
}
