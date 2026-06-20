'use server';

import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courseInstructors, courses } from '~/server/db/schema';

/**
 * Returns true when the educator is assigned to the course as its main
 * instructor (courses.instructor) or as a co-instructor (course_instructors
 * m2m). It deliberately does NOT check creatorId: a course is often created by
 * a super-admin and an existing educator is assigned afterwards, so ownership
 * for educators is defined by the instructor link, not by who created it.
 * Super-admins bypass this check entirely.
 */
export async function isCourseOwnedByEducator(
  courseId: number,
  userId: string
): Promise<boolean> {
  if (!Number.isFinite(courseId) || !userId) return false;

  // Main instructor.
  const owned = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.instructor, userId)))
    .limit(1);

  if (owned.length > 0) return true;

  // Co-instructor via the many-to-many table.
  const coInstructor = await db
    .select({ courseId: courseInstructors.courseId })
    .from(courseInstructors)
    .where(
      and(
        eq(courseInstructors.courseId, courseId),
        eq(courseInstructors.instructorId, userId)
      )
    )
    .limit(1);

  return coInstructor.length > 0;
}
