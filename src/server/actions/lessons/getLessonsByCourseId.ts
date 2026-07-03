'use server';

import { asc, eq, type InferSelectModel } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  activities,
  lessons,
  userActivitiesProgress,
  userLessonsProgress,
} from '~/server/db/schema';

import type { Lesson } from '~/types';

type LessonWithActivities = InferSelectModel<typeof lessons> & {
  activities?: Array<InferSelectModel<typeof activities>>;
  resourceNames?: string | null;
};

export async function getLessonsByCourseId(
  courseId: number,
  userId: string
): Promise<Lesson[]> {
  const lessonsData = (await db.query.lessons.findMany({
    where: eq(lessons.courseId, courseId),
    orderBy: [asc(lessons.title)],
    with: {
      activities: {
        with: {
          typeActi: true,
        },
      },
    },
  })) as LessonWithActivities[];

  const userLessonsProgressData = (await db.query.userLessonsProgress.findMany({
    where: eq(userLessonsProgress.userId, userId),
  })) as Array<typeof userLessonsProgress.$inferSelect>;

  const userActivitiesProgressData =
    (await db.query.userActivitiesProgress.findMany({
      where: eq(userActivitiesProgress.userId, userId),
    })) as Array<typeof userActivitiesProgress.$inferSelect>;

  // 🔥 Extra: Normalizar los títulos antes de ordenarlos
  const sortedLessons = [...lessonsData].sort(
    (a: LessonWithActivities, b: LessonWithActivities) => {
      return a.title.trim().localeCompare(b.title.trim(), 'es', {
        numeric: true,
      });
    }
  );

  const transformedLessons = sortedLessons.map(
    (lesson: LessonWithActivities) => {
      const lessonProgress = userLessonsProgressData.find(
        (progress: (typeof userLessonsProgressData)[number]) =>
          progress.lessonId === lesson.id
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
          lesson.activities?.map(
            (
              activity: NonNullable<LessonWithActivities['activities']>[number]
            ) => {
              const activityProgress = userActivitiesProgressData.find(
                (progress: (typeof userActivitiesProgressData)[number]) =>
                  progress.activityId === activity.id
              );
              return {
                ...activity,
                isCompleted: activityProgress?.isCompleted ?? false,
                userProgress: activityProgress?.progress ?? 0,
                createdAt: activity.lastUpdated, // Use lastUpdated as createdAt if not present
                attemptLimit: 0,
                currentAttempts: 0,
              };
            }
          ) ?? [],
      } as Lesson; // Add type assertion here
    }
  );

  return transformedLessons;
}
