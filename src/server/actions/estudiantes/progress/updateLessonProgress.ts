'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

import { unlockNextLesson } from '~/server/actions/estudiantes/lessons/unlockNextLesson';
import { db } from '~/server/db';
import { userLessonsProgress } from '~/server/db/schema';

// Actualizar el progreso de una lección
export async function updateLessonProgress(
  lessonId: number,
  progress: number
): Promise<void> {
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

  await db
    .update(userLessonsProgress)
    .set({ isLocked: progress === 0 })
    .where(
      and(
        eq(userLessonsProgress.userId, userId),
        eq(userLessonsProgress.lessonId, lessonId)
      )
    );

  if (progress >= 100) {
    await unlockNextLesson(lessonId);
  }
}