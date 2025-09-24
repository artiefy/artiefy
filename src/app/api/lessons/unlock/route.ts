import { NextResponse } from 'next/server';

import { currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { createNotification } from '~/server/actions/estudiantes/notifications/createNotification';
import { db } from '~/server/db';
import { lessons, userLessonsProgress } from '~/server/db/schema';
import { sortLessons } from '~/utils/lessonSorting';

const unlockRequestSchema = z.object({
  currentLessonId: z.number().int().positive().optional(), // preferido
  // fallback legacy (si lo envían): desbloquear explícitamente ese id (evitar si no es el siguiente)
  lessonId: z.number().int().positive().optional(),
  hasActivities: z.boolean(),
  allActivitiesCompleted: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const parsed = unlockRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const {
      currentLessonId,
      lessonId: legacyLessonId,
      hasActivities,
      allActivitiesCompleted,
    } = parsed.data;

    // Si no hay currentLessonId, usa comportamiento anterior (solo para compatibilidad)
    if (!currentLessonId && legacyLessonId) {
      // Validación mínima de condiciones
      const shouldUnlock = hasActivities ? allActivitiesCompleted : true;
      if (!shouldUnlock) {
        return NextResponse.json(
          { success: false, error: 'Activities not completed' },
          { status: 400 }
        );
      }

      await db
        .insert(userLessonsProgress)
        .values({
          userId: user.id,
          lessonId: legacyLessonId,
          progress: 0,
          isCompleted: false,
          isLocked: false,
          isNew: true,
          lastUpdated: new Date(),
        })
        .onConflictDoUpdate({
          target: [userLessonsProgress.userId, userLessonsProgress.lessonId],
          set: { isLocked: false, isNew: true, lastUpdated: new Date() },
        });

      const nextLesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, legacyLessonId),
        columns: { id: true, title: true, courseId: true },
      });

      if (nextLesson) {
        await createNotification({
          userId: user.id,
          type: 'LESSON_UNLOCKED',
          title: '¡Nueva clase desbloqueada!',
          message: `Se ha desbloqueado la clase: ${nextLesson.title}`,
          metadata: { lessonId: nextLesson.id, courseId: nextLesson.courseId },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Lesson unlocked',
        nextLessonId: legacyLessonId,
      });
    }

    if (!currentLessonId) {
      return NextResponse.json(
        { success: false, error: 'currentLessonId required' },
        { status: 400 }
      );
    }

    // 1) Obtener lección actual con actividades y curso
    const current = await db.query.lessons.findFirst({
      where: eq(lessons.id, currentLessonId),
      with: { activities: true },
      columns: {
        id: true,
        title: true,
        courseId: true,
        coverVideoKey: true,
        orderIndex: true,
      },
    });

    if (!current?.courseId) {
      return NextResponse.json(
        { success: false, error: 'Current lesson not found' },
        { status: 404 }
      );
    }

    // 2) Ordenar todas las lecciones del curso (orderIndex primero, luego fallback por título)
    const courseLessons = await db.query.lessons.findMany({
      where: eq(lessons.courseId, current.courseId),
      columns: { id: true, title: true, orderIndex: true },
    });
    const ordered = sortLessons(courseLessons);
    const currentIndex = ordered.findIndex((l) => l.id === currentLessonId);
    const nextLesson =
      currentIndex >= 0 ? ordered[currentIndex + 1] : undefined;

    if (!nextLesson) {
      return NextResponse.json({
        success: true,
        message: 'No more lessons to unlock',
      });
    }

    // 3) Verificar condiciones de desbloqueo (server-side)
    const hasVideo = current.coverVideoKey && current.coverVideoKey !== 'none';
    const totalActivities = current.activities?.length ?? 0;

    // Progreso de video guardado
    const progressRow = await db.query.userLessonsProgress.findFirst({
      where: and(
        eq(userLessonsProgress.userId, user.id),
        eq(userLessonsProgress.lessonId, currentLessonId)
      ),
      columns: { progress: true },
    });
    const progress = progressRow?.progress ?? 0;

    let canUnlock = false;
    if (hasVideo && totalActivities > 0) {
      // Video + actividades => requiere ambos
      canUnlock = progress >= 100 && allActivitiesCompleted;
    } else if (hasVideo && totalActivities === 0) {
      // Solo video
      canUnlock = progress >= 100;
    } else if (!hasVideo && totalActivities > 0) {
      // Solo actividades
      canUnlock = allActivitiesCompleted;
    } else {
      // Sin video ni actividades (raro) => desbloquear
      canUnlock = true;
    }

    if (!canUnlock) {
      return NextResponse.json(
        { success: false, error: 'Unlock conditions not met' },
        { status: 400 }
      );
    }

    // 4) Desbloquear siguiente lección
    await db
      .insert(userLessonsProgress)
      .values({
        userId: user.id,
        lessonId: nextLesson.id,
        progress: 0,
        isCompleted: false,
        isLocked: false,
        isNew: true,
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: [userLessonsProgress.userId, userLessonsProgress.lessonId],
        set: { isLocked: false, isNew: true, lastUpdated: new Date() },
      });

    const nextLessonFull = await db.query.lessons.findFirst({
      where: eq(lessons.id, nextLesson.id),
      columns: { id: true, title: true, courseId: true },
    });

    if (nextLessonFull) {
      await createNotification({
        userId: user.id,
        type: 'LESSON_UNLOCKED',
        title: '¡Nueva clase desbloqueada!',
        message: `Se ha desbloqueado la clase: ${nextLessonFull.title}`,
        metadata: {
          lessonId: nextLessonFull.id,
          courseId: nextLessonFull.courseId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Next lesson unlocked successfully',
      nextLessonId: nextLesson.id,
    });
  } catch (error) {
    console.error('Error unlocking lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
