import { isUserEnrolled } from '~/server/actions/estudiantes/courses/enrollInCourse';
import { isCourseOwnedByEducator } from '~/server/queries/educatorCourseAccess';

import type { ApiSession } from '~/server/utils/apiAuth';

/**
 * Whether the caller may load or submit the activities of a course.
 *
 * - admin / super-admin: any course.
 * - educador: only courses they teach (same rule as the lesson page).
 * - everyone else: must be enrolled in the course (same rule the lesson view
 *   enforces with `isUserEnrolled`).
 */
export async function canAccessCourseActivities(
  session: ApiSession,
  courseId: number
): Promise<boolean> {
  if (!session.userId || !Number.isFinite(courseId)) return false;

  if (session.role === 'super-admin' || session.role === 'admin') return true;

  if (session.role === 'educador') {
    return isCourseOwnedByEducator(courseId, session.userId);
  }

  return isUserEnrolled(courseId, session.userId);
}
