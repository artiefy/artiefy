'use server';

import { currentUser } from '@clerk/nextjs/server';
import { db } from '~/server/db';
import {
  userLessonsProgress, lessons,
} from '~/server/db/schema';
import { eq, and } from 'drizzle-orm';


// Actualizar el progreso de una lección
export async function updateLessonProgress(lessonId: number, progress: number): Promise<void> {
  const user = await currentUser();
  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const userId = user.id;

  await db
    .insert(userLessonsProgress)
    .values({
      userId,
      lessonId,
      progress,
      isCompleted: progress >= 100,
      isLocked: false,
      lastUpdated: new Date(),
    })
    .onConflictDoUpdate({
      target: [userLessonsProgress.userId, userLessonsProgress.lessonId],
      set: {
        progress,
        isCompleted: progress >= 100,
        isLocked: false,
        lastUpdated: new Date(),
      },
    });

  await db.update(userLessonsProgress)
    .set({ isLocked: progress === 0 })
    .where(and(
      eq(userLessonsProgress.userId, userId),
      eq(userLessonsProgress.lessonId, lessonId)
    ));

  if (progress >= 100) {
    await unlockNextLesson(lessonId);
  }
}

// Desbloquear la siguiente lección
export async function unlockNextLesson(currentLessonId: number): Promise<{ success: boolean; nextLessonId?: number }> {
  const user = await currentUser();
  if (!user?.id) {
    throw new Error("Usuario no autenticado");
  }

  // Verify if the current lesson is completed (video and activity)
  const currentLessonProgress = await db.query.userLessonsProgress.findFirst({
    where: and(eq(userLessonsProgress.userId, user.id), eq(userLessonsProgress.lessonId, currentLessonId)),
  });

  if (!currentLessonProgress?.isCompleted) {
    return { success: false };
  }

  const currentLesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, currentLessonId),
  });

  if (!currentLesson) {
    throw new Error("Lección actual no encontrada");
  }

  const nextLesson = await db.query.lessons.findFirst({
    where: and(eq(lessons.courseId, currentLesson.courseId), eq(lessons.order, currentLesson.order + 1)),
  });

  if (nextLesson) {
    await db
      .insert(userLessonsProgress)
      .values({
        userId: user.id,
        lessonId: nextLesson.id,
        progress: 1, // Set initial progress to 1%
        isCompleted: false,
        isLocked: false,
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: [userLessonsProgress.userId, userLessonsProgress.lessonId],
        set: {
          isLocked: false,
          progress: 1, // Ensure progress is set to 1% on update
          lastUpdated: new Date(),
        },
      });

    return { success: true, nextLessonId: nextLesson.id };
  }

  return { success: false };
}
