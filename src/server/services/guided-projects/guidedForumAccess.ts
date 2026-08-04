import { clerkClient } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  guidedEnrollments,
  guidedProjectInstructors,
  guidedProjects,
  users,
} from '~/server/db/schema';

import 'server-only';

export type GuidedForumAccessFailure =
  'PROJECT_NOT_FOUND' | 'USER_NOT_FOUND' | 'NOT_AUTHORIZED';

export type GuidedForumAccessRole = 'admin' | 'instructor' | 'enrolled';

// Acceso al contenido protegido de un proyecto guiado: admin/super-admin
// (por rol persistido o Clerk), el instructor asignado o el
// creador/instructor principal
// del proyecto, o un estudiante inscrito. Un usuario que solo conozca la URL
// sin cumplir ninguna de estas condiciones queda fuera.
export async function getGuidedProjectContentAccess({
  projectId,
  userId,
}: {
  projectId: number;
  userId: string;
}): Promise<
  | { success: true; role: GuidedForumAccessRole }
  | { success: false; reason: GuidedForumAccessFailure }
> {
  const [project] = await db
    .select({
      id: guidedProjects.id,
      creatorId: guidedProjects.creatorId,
      instructor: guidedProjects.instructor,
    })
    .from(guidedProjects)
    .where(eq(guidedProjects.id, projectId))
    .limit(1);
  if (!project) return { success: false, reason: 'PROJECT_NOT_FOUND' };

  const [localUser] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!localUser) return { success: false, reason: 'USER_NOT_FOUND' };

  if (localUser.role === 'admin' || localUser.role === 'super-admin') {
    return { success: true, role: 'admin' };
  }

  if (project.creatorId === userId || project.instructor === userId) {
    return { success: true, role: 'instructor' };
  }

  const [assignedInstructor] = await db
    .select({ id: guidedProjectInstructors.id })
    .from(guidedProjectInstructors)
    .where(
      and(
        eq(guidedProjectInstructors.guidedProjectId, projectId),
        eq(guidedProjectInstructors.instructorId, userId)
      )
    )
    .limit(1);
  if (assignedInstructor) return { success: true, role: 'instructor' };

  const [enrollment] = await db
    .select({ id: guidedEnrollments.id })
    .from(guidedEnrollments)
    .where(
      and(
        eq(guidedEnrollments.userId, userId),
        eq(guidedEnrollments.guidedProjectId, projectId)
      )
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

export const getGuidedProjectForumAccess = getGuidedProjectContentAccess;
