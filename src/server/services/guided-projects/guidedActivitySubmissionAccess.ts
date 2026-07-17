import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  guidedEnrollments,
  guidedObjectiveActivities,
  guidedObjectives,
  users,
} from '~/server/db/schema';

import 'server-only';

export type GuidedActivitySubmissionAccessFailure =
  | 'ACTIVITY_NOT_FOUND'
  | 'ENROLLMENT_REQUIRED'
  | 'SESSION_LOCKED'
  | 'USER_NOT_FOUND';

export async function getGuidedActivitySubmissionAccess({
  activityId,
  projectId,
  userId,
}: {
  activityId: number;
  projectId: number;
  userId: string;
}): Promise<
  | { success: true }
  | { success: false; reason: GuidedActivitySubmissionAccessFailure }
> {
  const [localUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!localUser) return { success: false, reason: 'USER_NOT_FOUND' };

  const [activity] = await db
    .select({
      id: guidedObjectiveActivities.id,
      isEnabled: guidedObjectives.isEnabled,
    })
    .from(guidedObjectiveActivities)
    .innerJoin(
      guidedObjectives,
      eq(guidedObjectives.id, guidedObjectiveActivities.objectiveId)
    )
    .where(
      and(
        eq(guidedObjectiveActivities.id, activityId),
        eq(guidedObjectives.guidedProjectId, projectId)
      )
    )
    .limit(1);
  if (!activity) return { success: false, reason: 'ACTIVITY_NOT_FOUND' };
  if (!activity.isEnabled) return { success: false, reason: 'SESSION_LOCKED' };

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
  return enrollment
    ? { success: true }
    : { success: false, reason: 'ENROLLMENT_REQUIRED' };
}
