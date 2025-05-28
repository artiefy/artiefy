import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface UrlSubmissionRequest {
  activityId: number;
  userId: string;
  submissionData: {
    url: string;
    type: 'drive';
    uploadDate: string;
    status: 'pending' | 'reviewed';
  };
}

export async function POST(request: NextRequest) {
  try {
    const rawBody: unknown = await request.json();

    if (!isValidUrlSubmission(rawBody)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { activityId, userId, submissionData } = rawBody;

    // Save in Upstash with reset values
    const submissionKey = `activity:${activityId}:user:${userId}:urlsubmission`;
    await redis.set(
      submissionKey,
      {
        ...submissionData,
        grade: 0.0,
        status: 'pending',
        feedback: null,
      },
      { ex: 2592000 } // 30 days expiration
    );

    // Update database progress
    await db
      .insert(userActivitiesProgress)
      .values({
        userId,
        activityId,
        progress: 100,
        isCompleted: true,
        lastUpdated: new Date(),
        attemptCount: 1,
        revisada: false,
        finalGrade: 0.0,
      })
      .onConflictDoUpdate({
        target: [
          userActivitiesProgress.userId,
          userActivitiesProgress.activityId,
        ],
        set: {
          progress: 100,
          isCompleted: true,
          lastUpdated: new Date(),
          attemptCount: sql`${userActivitiesProgress.attemptCount} + 1`,
          finalGrade: 0.0,
          revisada: false,
        },
      });

    return NextResponse.json({
      success: true,
      message: 'URL guardada correctamente',
      url: submissionData.url,
    });
  } catch (error) {
    console.error('Error saving URL submission:', error);
    return NextResponse.json(
      { success: false, error: 'Error al guardar la URL' },
      { status: 500 }
    );
  }
}

function isValidUrlSubmission(data: unknown): data is UrlSubmissionRequest {
  if (!data || typeof data !== 'object') return false;

  const submission = data as Partial<UrlSubmissionRequest>;

  const hasValidTypes = Boolean(
    typeof submission.activityId === 'number' &&
      typeof submission.userId === 'string' &&
      submission.submissionData &&
      typeof submission.submissionData === 'object' &&
      typeof submission.submissionData.url === 'string' &&
      submission.submissionData.type === 'drive' &&
      typeof submission.submissionData.uploadDate === 'string'
  );

  const hasValidStatus = Boolean(
    submission.submissionData &&
      (submission.submissionData.status === 'pending' ||
        submission.submissionData.status === 'reviewed')
  );

  return hasValidTypes && hasValidStatus;
}
