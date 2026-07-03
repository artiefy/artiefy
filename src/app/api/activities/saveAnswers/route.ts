import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { activities, userActivitiesProgress } from '~/server/db/schema';
import { formatScoreNumber } from '~/utils/formatScore';

import type { ActivityResults, SavedAnswer } from '~/types';

export const dynamic = 'force-dynamic';

interface SaveAnswersRequest {
  activityId: number;
  userId: string;
  answers: Record<string, SavedAnswer>;
  score: number;
  allQuestionsAnswered: boolean;
}

interface ActivityData {
  revisada: boolean;
  id: number;
  parametroId: number | null;
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    // Security best practice: authenticate and bind the write to the caller so a
    // user cannot save answers/grades under another student's userId.
    const { userId: sessionUserId } = await auth();
    if (!sessionUserId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const data = (await request.json()) as SaveAnswersRequest;
    const { activityId, userId, answers } = data;

    if (userId !== sessionUserId) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Get activity and its details
    const activityKey = `activity:${activityId}`;
    const activity = await redis.get<ActivityData>(activityKey);

    const currentProgress = await db.query.userActivitiesProgress.findFirst({
      where: and(
        eq(userActivitiesProgress.userId, userId),
        eq(userActivitiesProgress.activityId, activityId)
      ),
    });

    const currentAttempts = currentProgress?.attemptCount ?? 0;

    // Verify attempts limit ONLY for revisada activities
    if (activity?.revisada && currentAttempts >= 3) {
      return NextResponse.json(
        {
          success: false,
          canClose: true,
          message: 'Has alcanzado el límite de intentos',
          attemptsExhausted: true,
          finalGrade: currentProgress?.finalGrade ?? 0,
        },
        { status: 403 }
      );
    }

    // Get activity to ensure we have the correct revisada value
    const dbActivity = await db.query.activities.findFirst({
      where: eq(activities.id, activityId),
    });

    if (!dbActivity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Calculate score
    const weightedScore = calculateWeightedScore(answers);
    const passed = weightedScore >= 3;

    // Prepare results for Redis
    const results: ActivityResults = {
      answers,
      score: weightedScore,
      passed,
      submittedAt: new Date().toISOString(),
      attemptCount: currentAttempts + 1,
      finalGrade: weightedScore,
      parameterId: activity?.parametroId ?? undefined,
      revisada: activity?.revisada,
    };

    // Always save results to Redis regardless of activity type or attempts
    const resultsKey = `activity:${activityId}:user:${userId}:results`;
    await redis.set(resultsKey, results);

    const newAttemptCount = currentAttempts + 1;
    const isCompleted = dbActivity.revisada
      ? passed || newAttemptCount >= 3
      : passed;

    // Common values for all database operations
    const baseValues = {
      userId,
      activityId,
      progress: 100,
      isCompleted,
      lastUpdated: new Date(),
      finalGrade: weightedScore,
      lastAttemptAt: new Date(),
      revisada: dbActivity.revisada, // Use the actual value from the activities table
    };

    // For non-revisada activities
    if (!dbActivity.revisada) {
      await db
        .insert(userActivitiesProgress)
        .values({
          ...baseValues,
          attemptCount: newAttemptCount,
        })
        .onConflictDoUpdate({
          target: [
            userActivitiesProgress.userId,
            userActivitiesProgress.activityId,
          ],
          set: {
            ...baseValues,
            attemptCount: newAttemptCount,
          },
        });

      return NextResponse.json({
        success: passed,
        canClose: true,
        message: passed
          ? 'Actividad completada correctamente'
          : 'Actividad guardada. Puedes intentarlo nuevamente hasta aprobar.',
        score: weightedScore,
        attemptCount: newAttemptCount,
        isCompleted,
      });
    }

    // For revisada activities (with attempt limit)
    await db
      .insert(userActivitiesProgress)
      .values({
        ...baseValues,
        attemptCount: newAttemptCount,
      })
      .onConflictDoUpdate({
        target: [
          userActivitiesProgress.userId,
          userActivitiesProgress.activityId,
        ],
        set: {
          ...baseValues,
          attemptCount: newAttemptCount,
        },
      });

    return NextResponse.json({
      success: passed,
      canClose: passed || newAttemptCount >= 3,
      message: passed
        ? 'Actividad completada correctamente'
        : `Intento ${newAttemptCount}/3 completado`,
      score: weightedScore,
      attemptsRemaining: Math.max(0, 3 - newAttemptCount),
      attemptCount: newAttemptCount,
      isCompleted,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error al guardar las respuestas' },
      { status: 500 }
    );
  }
}

function calculateWeightedScore(answers: Record<string, SavedAnswer>): number {
  let totalWeight = 0;
  let weightedSum = 0;

  Object.values(answers).forEach((answer) => {
    const weight = answer.pesoPregunta ?? 1;
    totalWeight += weight;
    weightedSum += answer.isCorrect ? weight : 0;
  });

  return formatScoreNumber((weightedSum / totalWeight) * 5);
}
