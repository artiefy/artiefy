import { clerkClient } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses, enrollments, users } from '~/server/db/schema';
import { isCourseOwnedByEducator } from '~/server/queries/educatorCourseAccess';

import 'server-only';

export type CourseForumAccessFailure =
  'COURSE_NOT_FOUND' | 'USER_NOT_FOUND' | 'NOT_AUTHORIZED';

export type CourseForumAccessRole = 'admin' | 'instructor' | 'enrolled';

/**
 * Course forum access follows the same ownership rules as course content:
 * enrolled learners, the main/co-instructor, and admin or super-admin users.
 */
export async function getCourseForumAccess({
  courseId,
  userId,
}: {
  courseId: number;
  userId: string;
}): Promise<
  | { success: true; role: CourseForumAccessRole }
  | { success: false; reason: CourseForumAccessFailure }
> {
  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  if (!course) return { success: false, reason: 'COURSE_NOT_FOUND' };

  const [localUser] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!localUser) return { success: false, reason: 'USER_NOT_FOUND' };

  if (localUser.role === 'admin' || localUser.role === 'super-admin') {
    return { success: true, role: 'admin' };
  }

  if (await isCourseOwnedByEducator(courseId, userId)) {
    return { success: true, role: 'instructor' };
  }

  const [enrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
    )
    .limit(1);
  if (enrollment) return { success: true, role: 'enrolled' };

  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const role = clerkUser.publicMetadata?.role;
    if (role === 'admin' || role === 'super-admin') {
      return { success: true, role: 'admin' };
    }
  } catch {
    // Clerk is a fallback for role synchronization; DB access still applies.
  }

  return { success: false, reason: 'NOT_AUTHORIZED' };
}
