'use server';

import { eq, and } from 'drizzle-orm';
import { db } from '~/server/db';
import { lessons, lessonProgress } from '~/server/db/schema';

export async function getLessonByIdAction(lessonId: number) {
  try {
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
    });
    return { success: true, lesson };
  } catch (error) {
    console.error(`Error al obtener la lección con ID ${lessonId}:`, error);
    return { success: false, error: 'No se pudo obtener la lección' };
  }
}

export async function getLessonsByCourseIdAction(courseId: number) {
  try {
    const lessonsList = await db.query.lessons.findMany({
      where: eq(lessons.courseId, courseId),
      orderBy: (lessons, { asc }) => [asc(lessons.order)],
    });
    return { success: true, lessons: lessonsList };
  } catch (error) {
    console.error(
      `Error al obtener las lecciones del curso con ID ${courseId}:`,
      error
    );
    return {
      success: false,
      error: 'No se pudieron obtener las lecciones del curso',
    };
  }
}

export async function updateLessonCompletionProgressAction(
  lessonId: number,
  progress: number
) {
  try {
    await db
      .update(lessons)
      .set({ porcentajecompletado: progress })
      .where(eq(lessons.id, lessonId));

    return {
      success: true,
      message: 'Progreso de la lección actualizado correctamente',
    };
  } catch (error) {
    console.error('Error al actualizar el progreso de la lección:', error);
    return {
      success: false,
      error: 'No se pudo actualizar el progreso de la lección',
    };
  }
}

export async function unlockNextLessonAction(
  currentLessonId: number,
  courseId: number
) {
  try {
    const currentLesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, currentLessonId),
    });

    if (!currentLesson) {
      throw new Error('Lección actual no encontrada');
    }

    const nextLesson = await db.query.lessons.findFirst({
      where: (lessons, { and, eq, gt }) =>
        and(
          eq(lessons.courseId, courseId),
          gt(lessons.order, currentLesson.order)
        ),
      orderBy: (lessons, { asc }) => [asc(lessons.order)],
    });

    if (!nextLesson) {
      return {
        success: true,
        message: 'No hay más lecciones para desbloquear',
      };
    }

    await db
      .update(lessons)
      .set({ isLocked: false })
      .where(eq(lessons.id, nextLesson.id));

    return { success: true, nextLessonId: nextLesson.id };
  } catch (error) {
    console.error('Error al desbloquear la siguiente lección:', error);
    return {
      success: false,
      error: 'No se pudo desbloquear la siguiente lección',
    };
  }
}

export const getLessonProgressAction = async (
  userId: string,
  lessonId: number
): Promise<number> => {
  const result = await db
    .select({ progress: lessonProgress.progress })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.lessonId, lessonId)
      )
    );

  return result[0]?.progress ?? 0;
};

export const updateLessonProgressAction = async (
  userId: string,
  lessonId: number,
  progress: number
): Promise<void> => {
  const existingProgress = await db
    .select()
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.lessonId, lessonId)
      )
    );

  if (existingProgress.length > 0) {
    await db
      .update(lessonProgress)
      .set({ progress, lastUpdated: new Date() })
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.lessonId, lessonId)
        )
      );
  } else {
    await db
      .insert(lessonProgress)
      .values({ userId, lessonId, progress, lastUpdated: new Date() });
  }
};
