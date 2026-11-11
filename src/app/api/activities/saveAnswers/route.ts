import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { and, eq } from 'drizzle-orm';

import { canAccessCourseActivities } from '~/server/activities/courseAccess';
import {
  gradeSubmission,
  PASSING_SCORE,
} from '~/server/activities/gradeAnswers';
import { loadActivityQuestionBank } from '~/server/activities/questionBank';
import { db } from '~/server/db';
import { activities, userActivitiesProgress } from '~/server/db/schema';
import { getActivitySubmissionWindow } from '~/server/utils/activitySubmissionWindow';
import { getApiSession } from '~/server/utils/apiAuth';

import type { ActivityResults } from '~/types';

interface SaveAnswersRequest {
  activityId: number;
  userId: string;
  // Only `answers[questionId].answer` is read. Any client `isCorrect`,
  // `pesoPregunta` or `score` is ignored: the grade is computed here.
  answers: unknown;
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
    const session = await getApiSession();
    const sessionUserId = session.userId;
    if (!sessionUserId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const data = (await request.json()) as SaveAnswersRequest;
    const { userId, answers: submittedAnswers } = data;
    const activityId = Number(data.activityId);

    if (userId !== sessionUserId) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    if (!Number.isInteger(activityId) || activityId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Actividad inválida' },
        { status: 400 }
      );
    }

    // Get activity to ensure we have the correct revisada value
    const dbActivity = await db.query.activities.findFirst({
      where: eq(activities.id, activityId),
      with: { lesson: { columns: { courseId: true } } },
    });

    if (!dbActivity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Only students enrolled in the course (or staff with access to it) can
    // submit, so the grading feedback cannot be used as an answer-key oracle
    // for arbitrary activities.
    const hasAccess = await canAccessCourseActivities(
      session,
      dbActivity.lesson.courseId
    );
    if (!hasAccess) {
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

    // A passed attempt reveals the correct answers, so it cannot be followed
    // by a new attempt (the modal never offers a retry after passing).
    if (
      currentAttempts > 0 &&
      (currentProgress?.finalGrade ?? 0) >= PASSING_SCORE
    ) {
      return NextResponse.json(
        {
          success: false,
          canClose: true,
          message: 'Ya aprobaste esta actividad',
          alreadyPassed: true,
          finalGrade: currentProgress?.finalGrade ?? 0,
        },
        { status: 409 }
      );
    }

    // Enforce the submission time window (fechaInicioActividad / fechaMaximaEntrega).
    const submissionWindow = getActivitySubmissionWindow(
      dbActivity.fechaInicioActividad,
      dbActivity.fechaMaximaEntrega
    );
    if (!submissionWindow.isOpen) {
      return NextResponse.json(
        {
          success: false,
          canClose: true,
          error:
            submissionWindow.message ??
            'La actividad no está disponible para entrega en este momento.',
        },
        { status: 403 }
      );
    }

    // Grade against the stored answer key, never against client data.
    const questionBank = await loadActivityQuestionBank(activityId);
    const graded = gradeSubmission(questionBank, submittedAnswers);
    if (graded.totalQuestions === 0) {
      return NextResponse.json(
        { success: false, error: 'La actividad no tiene preguntas' },
        { status: 400 }
      );
    }

    const weightedScore = graded.score;
    const passed = graded.passed;

    // Prepare results for Redis
    const results: ActivityResults = {
      answers: graded.answers,
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
        answers: graded.answers,
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
      answers: graded.answers,
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
