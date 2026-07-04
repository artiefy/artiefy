import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import { sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';
import { checkActivitySubmissionWindow } from '~/server/utils/activitySubmissionWindow';

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
    // Security best practice: authenticate and bind the write to the caller.
    const { userId: sessionUserId } = await auth();
    if (!sessionUserId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as RequestBody;
    const { activityId, userId, submissionData } = body;

    if (!activityId || !userId || !submissionData?.url) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    if (userId !== sessionUserId) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Enforce the submission time window before persisting the URL submission.
    const submissionWindow = await checkActivitySubmissionWindow(activityId);
    if (!submissionWindow.isOpen) {
      return NextResponse.json(
        {
          success: false,
          error:
            submissionWindow.message ??
            'La actividad no está disponible para entrega en este momento.',
        },
        { status: 403 }
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
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error al guardar la URL' },
      { status: 500 }
    );
  }
}
