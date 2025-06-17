'use server';

import { currentUser } from '@clerk/nextjs/server';
import { and,eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { activities,lessons, userLessonsProgress } from '~/server/db/schema';

const unlockNextLesson = async (lessonId: number, userId: string) => {
  // Obtener información de la lección actual
  const currentLesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
  });

  if (!currentLesson) return;

  // Obtener todas las lecciones del curso ordenadas por título
  const courseLessons = await db.query.lessons.findMany({
    where: eq(lessons.courseId, currentLesson.courseId),
    orderBy: (lessons, { asc }) => [asc(lessons.title)],
  });

  // Encontrar la siguiente lección
  const currentIndex = courseLessons.findIndex((l) => l.id === lessonId);
  const nextLesson = courseLessons[currentIndex + 1];

  if (!nextLesson) return;

  // Verificar si hay actividades en la lección actual
  const lessonActivities = await db.query.activities.findMany({
    where: eq(activities.lessonsId, lessonId),
  });

  if (lessonActivities.length === 0) {
    // Si no hay actividades, desbloquear automáticamente la siguiente lección
    await db
      .update(userLessonsProgress)
      .set({ isLocked: false })
      .where(
        and(
          eq(userLessonsProgress.userId, userId),
          eq(userLessonsProgress.lessonId, nextLesson.id)
        )
      );
  }
};

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
      isNew: progress >= 1 ? false : true,
      lastUpdated: new Date(),
    })
    .onConflictDoUpdate({
      target: [userLessonsProgress.userId, userLessonsProgress.lessonId],
      set: {
        progress,
        isCompleted: progress >= 100,
        isLocked: false,
        isNew: progress >= 1 ? false : true,
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
    await unlockNextLesson(lessonId, user.id);
  }
}
