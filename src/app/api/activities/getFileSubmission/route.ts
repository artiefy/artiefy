import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { and, eq } from 'drizzle-orm';

// Importa la acción para crear notificaciones
import { createNotification } from '~/server/actions/estudiantes/notifications/createNotification';
import { db } from '~/server/db';
import { activities, userActivitiesProgress } from '~/server/db/schema';

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

    // Obtener el lessonId de la actividad
    let lessonId: number | undefined = undefined;
    const activityDb = await db.query.activities.findFirst({
      where: eq(activities.id, parseInt(activityId)),
    });
    if (activityDb?.lessonsId) {
      lessonId = activityDb.lessonsId;
    }

    // --- Notificación si grade pasa de 0 a >0 y status es reviewed ---
    if (
      submission &&
      typeof submission === 'object' &&
      'grade' in submission &&
      typeof submission.grade === 'number' &&
      'status' in submission &&
      submission.status === 'reviewed'
    ) {
      const lastGrade = progress?.finalGrade ?? 0;
      // Solo crear notificación si antes era 0 y ahora >0
      if (submission.grade > 0 && lastGrade === 0) {
        await createNotification({
          userId,
          type: 'ACTIVITY_COMPLETED',
          title: '¡Tu documento ha sido calificado!',
          message: `El educador ha calificado tu documento en la clase. Revisa tu calificación.`,
          metadata: {
            activityId: parseInt(activityId),
            lessonId, // para redirigir al modal de la actividad tipo documento
            openModal: true, // para abrir el modal en el frontend
          },
        });
      }
    }

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
