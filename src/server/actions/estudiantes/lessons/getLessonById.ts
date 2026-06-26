'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  courseCourseTypes,
  lessons,
  userActivitiesProgress,
  userLessonsProgress,
} from '~/server/db/schema';

import type { Activity, Course, Lesson } from '~/types';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export async function getLessonById(
  lessonId: number,
  userId: string
): Promise<Lesson | null> {
  try {
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
      with: {
        activities: true,
        course: {
          with: {
            enrollments: true,
            lessons: true,
            courseType: true,
          },
        },
      },
    });

    if (!lesson) return null;

    // Fetch all course types for this course
    let courseTypeRelations: Array<{
      courseType: { requiredSubscriptionLevel: string | null } | null;
    }> = [];
    try {
      courseTypeRelations = await db.query.courseCourseTypes.findMany({
        where: eq(courseCourseTypes.courseId, lesson.course.id),
        with: {
          courseType: true,
        },
      });
    } catch (error) {
      console.warn(
        'No se pudieron cargar los tipos de curso de la lección:',
        getErrorMessage(error)
      );
    }

    const courseEnrollments = lesson.course.enrollments ?? [];

    // Get progress for all lessons in the course
    let lessonsProgress: Array<typeof userLessonsProgress.$inferSelect> = [];
    try {
      lessonsProgress = await db.query.userLessonsProgress.findMany({
        where: eq(userLessonsProgress.userId, userId),
      });
    } catch (error) {
      console.warn(
        'No se pudo cargar el progreso de las lecciones:',
        getErrorMessage(error)
      );
    }

    const lessonsProgressByLessonId = new Map(
      lessonsProgress.map((progress) => [progress.lessonId, progress])
    );

    // Transform course lessons with progress data
    const transformedLessons: Lesson[] = lesson.course.lessons.map((l) => ({
      ...l,
      porcentajecompletado: lessonsProgressByLessonId.get(l.id)?.progress ?? 0,
      userProgress: lessonsProgressByLessonId.get(l.id)?.progress ?? 0,
      lastPositionSeconds:
        lessonsProgressByLessonId.get(l.id)?.lastPositionSeconds ?? 0,
      isCompleted: lessonsProgressByLessonId.get(l.id)?.isCompleted ?? false,
      isLocked: false,
      isNew: lessonsProgressByLessonId.get(l.id)?.isNew ?? true,
      resourceNames: l.resourceNames ? l.resourceNames.split(',') : [],
    }));

    // Transform raw course data to match Course interface
    const transformedCourse: Course = {
      ...lesson.course,
      courseTypeId: lesson.course.courseTypeId ?? 0,
      totalStudents: courseEnrollments.length,
      lessons: transformedLessons,
      enrollments: courseEnrollments,
      isActive: lesson.course.isActive ?? false,
      visibility: lesson.course.visibility ?? true,
      requiresProgram: false,
      isFree: courseTypeRelations.some(
        (ct) => ct.courseType?.requiredSubscriptionLevel === 'none'
      ),
      courseType:
        lesson.course.courseType !== null
          ? {
              name: lesson.course.courseType.name,
              requiredSubscriptionLevel:
                lesson.course.courseType.requiredSubscriptionLevel,
              isPurchasableIndividually:
                lesson.course.courseType.isPurchasableIndividually ?? false,
              price: lesson.course.courseType.price ?? null,
            }
          : undefined,
    };

    const lessonProgress = lessonsProgressByLessonId.get(lessonId);

    let userActivitiesProgressData: Array<
      typeof userActivitiesProgress.$inferSelect
    > = [];
    try {
      userActivitiesProgressData =
        await db.query.userActivitiesProgress.findMany({
          where: eq(userActivitiesProgress.userId, userId),
        });
    } catch (error) {
      console.warn(
        'No se pudo cargar el progreso de las actividades:',
        getErrorMessage(error)
      );
    }

    const transformedLesson: Lesson = {
      ...lesson,
      porcentajecompletado: lessonProgress?.progress ?? 0,
      isLocked: false,
      userProgress: lessonProgress?.progress ?? 0,
      lastPositionSeconds: lessonProgress?.lastPositionSeconds ?? 0,
      isCompleted: lessonProgress?.isCompleted ?? false,
      isNew: lessonProgress?.isNew ?? true,
      resourceNames: lesson.resourceNames
        ? lesson.resourceNames.split(',').filter(Boolean)
        : [],
      resourceKey: lesson.resourceKey || '',
      activities:
        lesson.activities?.map((activity) => {
          const activityProgress = userActivitiesProgressData.find(
            (progress) => progress.activityId === activity.id
          );
          return {
            ...activity,
            isCompleted: activityProgress?.isCompleted ?? false,
            userProgress: activityProgress?.progress ?? 0,
            attemptLimit: 0,
            currentAttempts: 0,
          } as Activity;
        }) ?? [],
      course: transformedCourse,
    };

    return transformedLesson;
  } catch (error) {
    console.error('Error al obtener la lección por ID:', error);
    throw new Error('Error al obtener la lección por ID');
  }
}
