'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  enrollments,
  lessons,
  userLessonsProgress,
  users,
} from '~/server/db/schema';
import { sortLessons } from '~/utils/lessonSorting';

export interface EnrolledCourse {
  id: number;
  title: string;
  instructorName: string;
  coverImageKey: string | null;
  // progress is the averaged progress across the course lessons (0-100)
  progress: number;
  rating: number;
  category: {
    name: string;
  } | null;
  // Lesson navigation helpers
  firstLessonId?: number | null;
  continueLessonId?: number | null; // where the student should continue
  continueLessonNumber?: number | null; // 1-based index for display
  continueLessonTitle?: string | null;
  // Last unlocked lesson (prefers the lesson with highest orderIndex that is unlocked)
  lastUnlockedLessonId?: number | null;
  lastUnlockedLessonTitle?: string | null;
  lastUnlockedLessonNumber?: number | null;
}

export async function getEnrolledCourses(): Promise<EnrolledCourse[]> {
  try {
    const user = await currentUser();
    if (!user?.id) throw new Error('Usuario no autenticado');

    // Get enrolled courses with category relation
    const enrolledCourses = await db.query.enrollments.findMany({
      where: eq(enrollments.userId, user.id),
      with: {
        course: {
          with: {
            category: true, // Include category relation
          },
        },
      },
    });

    // Get progress for each course
    // Filtrar inscripciones que no referencian un curso (program enrollments may exist)
    const validEnrollments = enrolledCourses.filter(
      (enrollment) => enrollment.courseId != null && enrollment.course != null
    );

    const coursesWithProgress = await Promise.all(
      validEnrollments.map(async (enrollment) => {
        // Get all lessons for this course
        const courseLessons = await db.query.lessons.findMany({
          where: eq(lessons.courseId, enrollment.courseId!),
        });

        // Get progress for all lessons belonging to this user
        const allLessonsProgress = await db.query.userLessonsProgress.findMany({
          where: eq(userLessonsProgress.userId, user.id),
        });

        // Create a map of progress by lessonId for quick lookup
        const progressByLessonId = new Map<
          number,
          (typeof allLessonsProgress)[number]
        >();
        for (const p of allLessonsProgress) {
          progressByLessonId.set(p.lessonId, p);
        }

        // Calculate overall course progress as average of lesson.progress values
        const totalLessons = courseLessons.length;
        const sumProgress = courseLessons.reduce((acc, lesson) => {
          const p = progressByLessonId.get(lesson.id);
          return acc + (p?.progress ?? 0);
        }, 0);

        const progress =
          totalLessons > 0 ? Math.round(sumProgress / totalLessons) : 0;

        // Determine last unlocked lesson: look for lessons that have a progress entry with isLocked === false
        // and pick the one with the highest orderIndex (using sortLessons to ensure orderIndex is considered)
        const sortedCourseLessons = sortLessons(courseLessons);

        const unlockedLessons = sortedCourseLessons.filter((lesson) => {
          const p = progressByLessonId.get(lesson.id);
          return p ? p.isLocked === false : false;
        });

        let lastUnlockedLessonId: number | null = null;
        let lastUnlockedLessonTitle: string | null = null;
        let lastUnlockedLessonNumber: number | null = null;

        if (unlockedLessons.length > 0) {
          const last = unlockedLessons[unlockedLessons.length - 1];
          lastUnlockedLessonId = last.id;
          lastUnlockedLessonTitle = last.title;
          lastUnlockedLessonNumber =
            sortedCourseLessons.findIndex((l) => l.id === last.id) + 1;
        }

        // Fetch instructor name
        const instructor = await db.query.users.findFirst({
          where: eq(users.id, enrollment.course!.instructor!),
        });

        const instructorName = instructor
          ? `${instructor.name}`
          : 'Unknown Instructor';

        // Order lessons reliably and determine where the student should continue (first incomplete)
        const firstIncompleteIndex = sortedCourseLessons.findIndex((lesson) => {
          const p = progressByLessonId.get(lesson.id);
          return !p?.isCompleted;
        });

        const continueLessonId =
          firstIncompleteIndex !== -1
            ? sortedCourseLessons[firstIncompleteIndex].id
            : sortedCourseLessons.length > 0
              ? sortedCourseLessons[sortedCourseLessons.length - 1].id
              : null;

        const continueLessonNumber =
          firstIncompleteIndex !== -1
            ? firstIncompleteIndex + 1
            : sortedCourseLessons.length > 0
              ? sortedCourseLessons.length
              : null;

        const continueLessonTitle =
          firstIncompleteIndex !== -1
            ? sortedCourseLessons[firstIncompleteIndex].title
            : sortedCourseLessons.length > 0
              ? sortedCourseLessons[sortedCourseLessons.length - 1].title
              : null;

        const firstLessonId =
          sortedCourseLessons.length > 0 ? sortedCourseLessons[0].id : null;

        return {
          id: enrollment.courseId!,
          title: enrollment.course!.title,
          instructorName: instructorName,
          coverImageKey: enrollment.course!.coverImageKey,
          progress,
          rating: enrollment.course!.rating ?? 0,
          category: enrollment.course!.category
            ? {
                name: enrollment.course!.category.name,
              }
            : null,
          firstLessonId,
          continueLessonId,
          continueLessonNumber,
          continueLessonTitle,
          lastUnlockedLessonId,
          lastUnlockedLessonTitle,
          lastUnlockedLessonNumber,
        } as EnrolledCourse;
      })
    );

    return coursesWithProgress;
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    throw new Error('Error al obtener los cursos inscritos');
  }
}
