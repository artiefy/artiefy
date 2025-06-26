'use server';

import { revalidatePath } from 'next/cache';

import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { createNotification } from '~/server/actions/estudiantes/notifications/createNotification';
import { db } from '~/server/db';
import { lessons, userLessonsProgress } from '~/server/db/schema';
import { sortLessons } from '~/utils/lessonSorting';

export async function unlockNextLesson(
  currentLessonId: number
): Promise<{ success: boolean; nextLessonId?: number }> {
  try {
    const user = await currentUser();
    if (!user?.id) throw new Error('Usuario no autenticado');

    // Get current lesson and its activity status
    const currentLesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, currentLessonId),
      with: {
        activities: true,
      },
    });

    if (!currentLesson?.courseId) {
      return { success: false };
    }

    // Get all lessons for the course
    const courseLessons = await db.query.lessons.findMany({
      where: eq(lessons.courseId, currentLesson.courseId),
    });

    // Ordenar las lecciones usando sortLessons
    const sortedLessons = sortLessons(courseLessons);

    // Buscar el índice de la lección actual
    const currentIndex = sortedLessons.findIndex(
      (l) => l.id === currentLessonId
    );
    // La siguiente lección en orden
    const nextLesson =
      currentIndex !== -1 ? sortedLessons[currentIndex + 1] : undefined;

    if (!nextLesson) {
      return { success: false };
    }

    // Update progress for next lesson
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
        set: {
          isLocked: false,
          isNew: true,
          lastUpdated: new Date(),
        },
      });

    // Add notification for unlocked lesson
    await createNotification({
      userId: user.id,
      type: 'LESSON_UNLOCKED',
      title: '¡Nueva lección desbloqueada!',
      message: `Se ha desbloqueado la lección: ${nextLesson.title}`,
      metadata: {
        lessonId: nextLesson.id,
        courseId: currentLesson.courseId,
      },
    });

    revalidatePath('/estudiantes/clases/[id]', 'page');

    return {
      success: true,
      nextLessonId: nextLesson.id,
    };
  } catch (error) {
    console.error('Error unlocking next lesson:', error);
    return { success: false };
  }
}
