import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollmentPrograms, enrollments, materias } from '~/server/db/schema';
import { isCourseOwnedByEducator } from '~/server/queries/educatorCourseAccess';
import { getApiSession } from '~/server/utils/apiAuth';

import 'server-only';

export type CourseContentAccess =
  { ok: true; userId: string } | { ok: false; status: 401 | 403 };

/**
 * Private course content (lesson media keys, join links, recordings) is only
 * for signed-in callers who are admin/super-admin, the educator who owns the
 * course, or a student enrolled in it directly or through a program that
 * includes the course.
 */
export async function checkCourseContentAccess(
  courseId: number
): Promise<CourseContentAccess> {
  const session = await getApiSession();
  if (!session.userId) return { ok: false, status: 401 };

  const { userId, role } = session;

  if (role === 'admin' || role === 'super-admin') {
    return { ok: true, userId };
  }

  if (role === 'educador') {
    return (await isCourseOwnedByEducator(courseId, userId))
      ? { ok: true, userId }
      : { ok: false, status: 403 };
  }

  const [courseEnrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
    )
    .limit(1);
  if (courseEnrollment) return { ok: true, userId };

  const [programEnrollment] = await db
    .select({ id: enrollmentPrograms.id })
    .from(enrollmentPrograms)
    .innerJoin(materias, eq(materias.programaId, enrollmentPrograms.programaId))
    .where(
      and(
        eq(enrollmentPrograms.userId, userId),
        eq(materias.courseid, courseId)
      )
    )
    .limit(1);

  return programEnrollment ? { ok: true, userId } : { ok: false, status: 403 };
}
