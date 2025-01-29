'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { courses, userLessonsProgress } from '~/server/db/schema';
import type { Course } from '~/types';

// Obtener un curso específico por ID
export async function getCourseById(courseId: number): Promise<Course | null> {
    const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId),
        with: {
            category: true,
            modalidad: true,
            dificultad: true,
            lessons: {
                orderBy: (lessons, { asc }) => [asc(lessons.order)],
                with: {
                    activities: true,
                },
            },
            enrollments: true,
        },
    });

    if (!course) {
        return null;
    }

    const user = await currentUser();
    const userLessonsProgressData = user?.id
        ? await db.query.userLessonsProgress.findMany({
              where: eq(userLessonsProgress.userId, user.id),
          })
        : [];

    const transformedCourse: Course = {
        ...course,
        totalStudents: course.enrollments?.length ?? 0,
        lessons: course.lessons?.map((lesson) => {
            const lessonProgress = userLessonsProgressData.find(
                (progress) => progress.lessonId === lesson.id
            );
            return {
                ...lesson,
                isLocked: lessonProgress ? lessonProgress.isLocked : true,
                isCompleted: lessonProgress ? lessonProgress.isCompleted : false,
                userProgress: lessonProgress ? lessonProgress.progress : 0,
                porcentajecompletado: lessonProgress ? lessonProgress.progress : 0,
                activities: lesson.activities?.map((activity) => ({
                  ...activity,
                  isCompleted: false,
                  userProgress: 0,
                  typeid: activity.typeid,
              })) ?? [],
            };
        }) ?? [],
    };

    return transformedCourse;
}
