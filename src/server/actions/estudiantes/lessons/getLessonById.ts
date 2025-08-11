"use server";

import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import {
  courseCourseTypes,
  enrollments,
  lessons,
  userActivitiesProgress,
  userLessonsProgress,
} from "~/server/db/schema";

import type { Activity, Course, Lesson } from "~/types";

export async function getLessonById(
  lessonId: number,
  userId: string,
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
    const courseTypeRelations = await db.query.courseCourseTypes.findMany({
      where: eq(courseCourseTypes.courseId, lesson.course.id),
      with: {
        courseType: true,
      },
    });

    // Get enrollments count for the course
    const courseEnrollments = await db.query.enrollments.findMany({
      where: eq(enrollments.courseId, lesson.course.id),
    });

    // Get progress for all lessons in the course
    const lessonsProgress = await db.query.userLessonsProgress.findMany({
      where: eq(userLessonsProgress.userId, userId),
    });

    // Transform course lessons with progress data
    const transformedLessons: Lesson[] = lesson.course.lessons.map((l) => ({
      ...l,
      porcentajecompletado:
        lessonsProgress.find((p) => p.lessonId === l.id)?.progress ?? 0,
      userProgress:
        lessonsProgress.find((p) => p.lessonId === l.id)?.progress ?? 0,
      isCompleted:
        lessonsProgress.find((p) => p.lessonId === l.id)?.isCompleted ?? false,
      isLocked:
        lessonsProgress.find((p) => p.lessonId === l.id)?.isLocked ?? true,
      isNew: lessonsProgress.find((p) => p.lessonId === l.id)?.isNew ?? true,
      resourceNames: l.resourceNames ? l.resourceNames.split(",") : [],
    }));

    // Transform raw course data to match Course interface
    const transformedCourse: Course = {
      ...lesson.course,
      courseTypeId: lesson.course.courseTypeId ?? 0,
      totalStudents: courseEnrollments.length,
      lessons: transformedLessons,
      enrollments: courseEnrollments,
      isActive: lesson.course.isActive ?? false,
      requiresProgram: false,
      isFree: courseTypeRelations.some(
        (ct) => ct.courseType?.requiredSubscriptionLevel === "none",
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

    const lessonProgress = await db.query.userLessonsProgress.findFirst({
      where: and(
        eq(userLessonsProgress.userId, userId),
        eq(userLessonsProgress.lessonId, lessonId),
      ),
    });

    const userActivitiesProgressData =
      await db.query.userActivitiesProgress.findMany({
        where: eq(userActivitiesProgress.userId, userId),
      });

    const transformedLesson: Lesson = {
      ...lesson,
      porcentajecompletado: lessonProgress?.progress ?? 0,
      isLocked: lessonProgress?.isLocked ?? true,
      userProgress: lessonProgress?.progress ?? 0,
      isCompleted: lessonProgress?.isCompleted ?? false,
      isNew: lessonProgress?.isNew ?? true,
      resourceNames: lesson.resourceNames
        ? lesson.resourceNames.split(",").filter(Boolean)
        : [],
      resourceKey: lesson.resourceKey || "",
      activities:
        (lesson.activities as Activity[] | undefined)?.map((activity) => {
          const activityProgress = userActivitiesProgressData.find(
            (progress) => progress.activityId === activity.id,
          );
          return {
            ...activity,
            isCompleted: activityProgress?.isCompleted ?? false,
            userProgress: activityProgress?.progress ?? 0,
          };
        }) ?? [],
      course: transformedCourse,
    };

    return transformedLesson;
  } catch (error) {
    console.error("Error al obtener la lección por ID:", error);
    throw new Error("Error al obtener la lección por ID");
  }
}
