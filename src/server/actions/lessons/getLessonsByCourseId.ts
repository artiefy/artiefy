'use server';

import { asc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  lessons,
  userActivitiesProgress,
  userLessonsProgress,
} from '~/server/db/schema';

import type { Lesson } from '~/types';

export async function getLessonsByCourseId(
  courseId: number,
  userId: string
): Promise<Lesson[]> {
  const lessonsData = await db.query.lessons.findMany({
    where: eq(lessons.courseId, courseId),
    orderBy: [asc(lessons.title)],
    with: {
      activities: {
        with: {
          typeActi: true,
        },
      },
    },
  });

  const userLessonsProgressData = await db.query.userLessonsProgress.findMany({
    where: eq(userLessonsProgress.userId, userId),
  });

  const userActivitiesProgressData =
    await db.query.userActivitiesProgress.findMany({
      where: eq(userActivitiesProgress.userId, userId),
    });

  // 🔥 Extra: Normalizar los títulos antes de ordenarlos
  const sortedLessons = lessonsData.sort((a, b) => {
    return a.title.trim().localeCompare(b.title.trim(), 'es', {
      numeric: true,
    });
  });

  const transformedLessons = sortedLessons.map((lesson) => {
    const lessonProgress = userLessonsProgressData.find(
      (progress) => progress.lessonId === lesson.id
    );

    return {
      ...lesson,
      porcentajecompletado: lessonProgress?.progress ?? 0,
      isLocked: lessonProgress?.isLocked ?? true,
      userProgress: lessonProgress?.progress ?? 0,
      resourceNames: lesson.resourceNames
        ? lesson.resourceNames.split(',')
        : [], // Convertir texto a array
      isCompleted: lessonProgress?.isCompleted ?? false,
      isNew: lessonProgress?.isNew ?? true, // Agregar propiedad isNew
      activities:
        lesson.activities?.map((activity) => {
          const activityProgress = userActivitiesProgressData.find(
            (progress) => progress.activityId === activity.id
          );
          return {
            ...activity,
            isCompleted: activityProgress?.isCompleted ?? false,
            userProgress: activityProgress?.progress ?? 0,
            createdAt: activity.lastUpdated, // Use lastUpdated as createdAt if not present
          };
        }) ?? [],
    } as Lesson; // Add type assertion here
  });

  return transformedLessons;
}
