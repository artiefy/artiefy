import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { activities, userActivitiesProgress } from '~/server/db/schema';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');

    console.log('🟡 Buscando notas para:', { userId, courseId });

    if (!courseId || !userId) {
      console.warn('❌ Faltan parámetros');
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      );
    }

    const courseIdParsed = parseInt(courseId, 10);
    if (isNaN(courseIdParsed)) {
      return NextResponse.json({ error: 'courseId inválido' }, { status: 400 });
    }

    const result = await db
      .select({
        activityId: userActivitiesProgress.activityId,
        grade: userActivitiesProgress.finalGrade,
        activityName: activities.name,
      })
      .from(userActivitiesProgress)
      .innerJoin(
        activities,
        eq(userActivitiesProgress.activityId, activities.id)
      )
      .where(
        and(
          eq(userActivitiesProgress.userId, userId),
          eq(activities.lessonsId, courseIdParsed) // Asegúrate que este campo sea correcto
        )
      );

    console.log('🟢 Resultados encontrados:', result);

    if (!result || result.length === 0) {
      return NextResponse.json({
        grades: [
          {
            activityId: -1,
            activityName: 'Sin actividad',
            grade: 1,
          },
        ],
      });
    }

    return NextResponse.json({ grades: result });
  } catch (error) {
    console.error('❌ Error fetching grades:', error);
    return NextResponse.json(
      { error: 'Error fetching grades' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody: unknown = await request.json();

    if (
      typeof rawBody !== 'object' ||
      rawBody === null ||
      !('activityId' in rawBody) ||
      !('userId' in rawBody) ||
      !('grade' in rawBody)
    ) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { activityId, userId, grade } = rawBody as {
      activityId: number;
      userId: string;
      grade: number;
    };

    console.log('✏️ Guardando nota:', { userId, activityId, grade });

    if (!activityId || !userId || grade === undefined) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // 1. PostgreSQL
    await db
      .insert(userActivitiesProgress)
      .values({
        userId,
        activityId,
        finalGrade: grade,
        isCompleted: true,
        progress: 100,
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          userActivitiesProgress.userId,
          userActivitiesProgress.activityId,
        ],
        set: {
          finalGrade: grade,
          lastUpdated: new Date(),
        },
      });

    console.log('✅ Nota guardada o actualizada en BD');

    // 2. Redis
    const submissionKey = `activity:${activityId}:user:${userId}:submission`;

    const submission = {
      grade,
      feedback: null,
    };

    await redis.set(submissionKey, submission, { ex: 60 * 60 * 24 * 30 });

    console.log('📦 Nota también guardada en Redis:', submissionKey);

    return NextResponse.json({ success: true, grade });
  } catch (error) {
    console.error('❌ Error updating grade:', error);
    return NextResponse.json(
      { error: 'Error updating grade' },
      { status: 500 }
    );
  }
}
