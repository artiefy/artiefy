import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface SubmissionData {
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  status: 'pending' | 'reviewed';
  submissionType: 'url';
  url: string;
}

interface RequestBody {
  activityId: number;
  userId: string;
  submissionData: SubmissionData;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const { activityId, userId, submissionData } = body;

    if (!activityId || !userId || !submissionData?.url) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Save in Upstash with the same structure as file submissions
    const submissionKey = `activity:${activityId}:user:${userId}:submission`;
    const submission = {
      ...submissionData,
      grade: 0.0,
      feedback: null,
    };

    await redis.set(submissionKey, submission, { ex: 2592000 }); // 30 days expiration

    // Update activity progress in the database
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
      submission,
    });
  } catch (error) {
    console.error('Error saving URL submission:', error);
    return NextResponse.json(
      { success: false, error: 'Error al guardar la URL' },
      { status: 500 }
    );
  }
}
