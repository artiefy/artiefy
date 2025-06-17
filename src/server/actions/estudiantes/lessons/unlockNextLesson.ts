'use server';

import { revalidatePath } from 'next/cache';

import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { createNotification } from '~/server/actions/estudiantes/notifications/createNotification';
import { db } from '~/server/db';
import { lessons,userLessonsProgress } from '~/server/db/schema';

interface LessonNumbers {
  session: number;
  class: number;
}

function extractNumbersFromTitle(title: string): LessonNumbers {
  // Handle "Bienvenida" case
  if (title.toLowerCase().includes('bienvenida')) {
    return { session: 0, class: 0 };
  }

  const sessionMatch = /sesion (\d+)/i.exec(title);
  const classMatch = /clase (\d+)/i.exec(title);

  return {
    session: sessionMatch ? parseInt(sessionMatch[1], 10) : 0,
    class: classMatch ? parseInt(classMatch[1], 10) : 0,
  };
}

function findNextLesson(
  currentLesson: { title: string },
  lessons: { title: string; id: number }[]
): { title: string; id: number } | undefined {
  const current = extractNumbersFromTitle(currentLesson.title);

  // Handle "Bienvenida" as a special case
  if (current.session === 0 && current.class === 0) {
    return lessons.find((l) => {
      const nums = extractNumbersFromTitle(l.title);
      return nums.session === 1 && nums.class === 1;
    });
  }

  // Find the next logical lesson
  return lessons.find((l) => {
    const nums = extractNumbersFromTitle(l.title);

    // Same session, next class
    if (nums.session === current.session && nums.class === current.class + 1) {
      return true;
    }

    // Next session, first class
    if (nums.session === current.session + 1 && nums.class === 1) {
      return true;
    }

    return false;
  });
}

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

    // Find next lesson using the new logic
    const nextLesson = findNextLesson(currentLesson, courseLessons);

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
