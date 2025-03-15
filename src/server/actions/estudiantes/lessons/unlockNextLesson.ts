'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, and, gt, asc } from 'drizzle-orm';

import { db } from '~/server/db';
import { userLessonsProgress, lessons } from '~/server/db/schema';

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

    if (!currentLesson) throw new Error('Lección actual no encontrada');

    // Check if lesson has activities and they are completed
    const hasActivities = currentLesson.activities && currentLesson.activities.length > 0;
    if (hasActivities) {
      const activityProgress = await db.query.userActivitiesProgress.findFirst({
        where: (progress, { and, eq }) => and(
          eq(progress.userId, user.id),
          eq(progress.activityId, currentLesson.activities[0].id)
        ),
      });

      if (!activityProgress?.isCompleted) {
        return { success: false, nextLessonId: undefined };
      }
    }

    // Find next lesson
    const nextLesson = await db.query.lessons.findFirst({
      where: and(
        eq(lessons.courseId, currentLesson.courseId),
        gt(lessons.title, currentLesson.title)
      ),
      orderBy: asc(lessons.title),
    });

    if (!nextLesson) {
      return { success: false };
    }

    // Only unlock next lesson if activity is completed
    await db.insert(userLessonsProgress)
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

    return { success: true, nextLessonId: nextLesson.id };
  } catch (error) {
    console.error('Error unlocking next lesson:', error);
    return { success: false };
  }
}
