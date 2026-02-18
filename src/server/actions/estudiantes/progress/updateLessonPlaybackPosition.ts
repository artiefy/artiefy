'use server';

import { currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { userLessonsProgress } from '~/server/db/schema';

export async function updateLessonPlaybackPosition(
  lessonId: number,
  lastPositionSeconds: number
): Promise<void> {
  const user = await currentUser();
  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const userId = user.id;
  const safeSeconds = Math.max(0, Math.floor(lastPositionSeconds));

  await db
    .insert(userLessonsProgress)
    .values({
      userId,
      lessonId,
      lastPositionSeconds: safeSeconds,
      lastUpdated: new Date(),
    })
    .onConflictDoUpdate({
      target: [userLessonsProgress.userId, userLessonsProgress.lessonId],
      set: {
        lastPositionSeconds: safeSeconds,
        lastUpdated: new Date(),
      },
    });

  await db
    .update(userLessonsProgress)
    .set({ isLocked: false })
    .where(
      and(
        eq(userLessonsProgress.userId, userId),
        eq(userLessonsProgress.lessonId, lessonId)
      )
    );
}
