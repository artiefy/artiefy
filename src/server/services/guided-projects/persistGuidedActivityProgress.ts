import { and, eq, inArray, sql } from 'drizzle-orm';

import {
  guidedEnrollments,
  guidedObjectiveActivities,
  guidedObjectives,
  userGuidedActivityProgress,
  userObjectiveProgress,
} from '~/server/db/schema';

import type * as schema from '~/server/db/schema';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { NeonTransaction } from 'drizzle-orm/neon-serverless';

type GuidedProjectTransaction = NeonTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export interface GuidedActivityProgressSuccess {
  success: true;
  guidedProjectId: number;
}

export interface GuidedActivityProgressFailure {
  success: false;
  reason:
    | 'ACTIVITY_NOT_FOUND'
    | 'ENROLLMENT_REQUIRED'
    | 'INVALID_PROJECT'
    | 'SESSION_LOCKED';
  message: string;
}

export type GuidedActivityProgressResult =
  | GuidedActivityProgressSuccess
  | GuidedActivityProgressFailure;

interface PersistGuidedActivityProgressInput {
  activityId: number;
  expectedGuidedProjectId?: number;
  incrementAttemptCount?: boolean;
  isCompleted: boolean;
  lockedAccess?: GuidedActivityAccess;
  userId: string;
}

export interface GuidedActivityAccess {
  activityId: number;
  enrollmentId: number;
  guidedProjectId: number;
  objectiveId: number;
  userId: string;
}

interface LockGuidedActivityAccessInput {
  activityId: number;
  expectedGuidedProjectId?: number;
  userId: string;
}

export type GuidedActivityAccessResult =
  | { success: true; access: GuidedActivityAccess }
  | GuidedActivityProgressFailure;

export async function lockGuidedActivityAccess(
  tx: GuidedProjectTransaction,
  { activityId, expectedGuidedProjectId, userId }: LockGuidedActivityAccessInput
): Promise<GuidedActivityAccessResult> {
  const [activity] = await tx
    .select({
      id: guidedObjectiveActivities.id,
      objectiveId: guidedObjectiveActivities.objectiveId,
    })
    .from(guidedObjectiveActivities)
    .where(eq(guidedObjectiveActivities.id, activityId))
    .limit(1);

  if (!activity) {
    return {
      success: false,
      reason: 'ACTIVITY_NOT_FOUND',
      message: 'Actividad no encontrada',
    };
  }

  const [objective] = await tx
    .select({
      id: guidedObjectives.id,
      guidedProjectId: guidedObjectives.guidedProjectId,
      isEnabled: guidedObjectives.isEnabled,
    })
    .from(guidedObjectives)
    .where(eq(guidedObjectives.id, activity.objectiveId))
    .limit(1);

  if (!objective) {
    return {
      success: false,
      reason: 'ACTIVITY_NOT_FOUND',
      message: 'La actividad no pertenece a una sesión válida',
    };
  }

  if (
    expectedGuidedProjectId !== undefined &&
    objective.guidedProjectId !== expectedGuidedProjectId
  ) {
    return {
      success: false,
      reason: 'INVALID_PROJECT',
      message: 'La actividad no pertenece al proyecto indicado',
    };
  }

  if (!objective.isEnabled) {
    return {
      success: false,
      reason: 'SESSION_LOCKED',
      message: 'Esta sesión está bloqueada',
    };
  }

  const [enrollment] = await tx
    .select({ id: guidedEnrollments.id })
    .from(guidedEnrollments)
    .where(
      and(
        eq(guidedEnrollments.userId, userId),
        eq(guidedEnrollments.guidedProjectId, objective.guidedProjectId)
      )
    )
    .limit(1)
    .for('update');

  if (!enrollment) {
    return {
      success: false,
      reason: 'ENROLLMENT_REQUIRED',
      message: 'Debes estar inscrito en este proyecto guiado',
    };
  }

  return {
    success: true,
    access: {
      activityId: activity.id,
      enrollmentId: enrollment.id,
      guidedProjectId: objective.guidedProjectId,
      objectiveId: objective.id,
      userId,
    },
  };
}

export async function persistGuidedActivityProgress(
  tx: GuidedProjectTransaction,
  {
    activityId,
    expectedGuidedProjectId,
    incrementAttemptCount = true,
    isCompleted,
    lockedAccess,
    userId,
  }: PersistGuidedActivityProgressInput
): Promise<GuidedActivityProgressResult> {
  const accessResult = lockedAccess
    ? { success: true as const, access: lockedAccess }
    : await lockGuidedActivityAccess(tx, {
        activityId,
        expectedGuidedProjectId,
        userId,
      });

  if (!accessResult.success) return accessResult;
  const access = accessResult.access;
  if (
    access.activityId !== activityId ||
    access.userId !== userId ||
    (expectedGuidedProjectId !== undefined &&
      access.guidedProjectId !== expectedGuidedProjectId)
  ) {
    return {
      success: false,
      reason: 'INVALID_PROJECT',
      message: 'El acceso bloqueado no corresponde a esta actividad',
    };
  }

  const now = new Date();
  await tx
    .insert(userGuidedActivityProgress)
    .values({
      userId,
      activityId,
      progress: isCompleted ? 100 : 0,
      isCompleted,
      lastAttemptAt: now,
      lastUpdated: now,
      attemptCount: 1,
    })
    .onConflictDoUpdate({
      target: [
        userGuidedActivityProgress.userId,
        userGuidedActivityProgress.activityId,
      ],
      set: {
        progress: isCompleted ? 100 : 0,
        isCompleted,
        lastUpdated: now,
        ...(incrementAttemptCount
          ? {
              attemptCount: sql`${userGuidedActivityProgress.attemptCount} + 1`,
              lastAttemptAt: now,
            }
          : {}),
      },
    });

  const allActivities = await tx
    .select({ id: guidedObjectiveActivities.id })
    .from(guidedObjectiveActivities)
    .where(eq(guidedObjectiveActivities.objectiveId, access.objectiveId));
  const activityIds = allActivities.map((item) => item.id);
  const activityProgress = await tx
    .select({
      activityId: userGuidedActivityProgress.activityId,
      isCompleted: userGuidedActivityProgress.isCompleted,
    })
    .from(userGuidedActivityProgress)
    .where(
      and(
        eq(userGuidedActivityProgress.userId, userId),
        inArray(userGuidedActivityProgress.activityId, activityIds)
      )
    );
  const completedCount = activityProgress.filter(
    (item) => item.isCompleted
  ).length;
  const objectiveProgressPercent =
    activityIds.length > 0 ? (completedCount / activityIds.length) * 100 : 0;
  const isObjectiveCompleted = objectiveProgressPercent === 100;

  await tx
    .insert(userObjectiveProgress)
    .values({
      userId,
      objectiveId: access.objectiveId,
      progress: objectiveProgressPercent,
      isCompleted: isObjectiveCompleted,
      isNew: false,
      lastUpdated: now,
    })
    .onConflictDoUpdate({
      target: [userObjectiveProgress.userId, userObjectiveProgress.objectiveId],
      set: {
        progress: objectiveProgressPercent,
        isCompleted: isObjectiveCompleted,
        isNew: false,
        lastUpdated: now,
      },
    });

  const projectObjectives = await tx
    .select({ id: guidedObjectives.id })
    .from(guidedObjectives)
    .where(eq(guidedObjectives.guidedProjectId, access.guidedProjectId));
  const objectiveIds = projectObjectives.map((item) => item.id);
  const objectiveProgress = await tx
    .select({
      objectiveId: userObjectiveProgress.objectiveId,
      isCompleted: userObjectiveProgress.isCompleted,
    })
    .from(userObjectiveProgress)
    .where(
      and(
        eq(userObjectiveProgress.userId, userId),
        inArray(userObjectiveProgress.objectiveId, objectiveIds)
      )
    );
  const completedObjectiveIds = new Set(
    objectiveProgress
      .filter((item) => item.isCompleted)
      .map((item) => item.objectiveId)
  );
  const isProjectCompleted =
    objectiveIds.length > 0 &&
    objectiveIds.every((objectiveId) => completedObjectiveIds.has(objectiveId));

  await tx
    .update(guidedEnrollments)
    .set({ completed: isProjectCompleted })
    .where(eq(guidedEnrollments.id, access.enrollmentId));

  return {
    success: true,
    guidedProjectId: access.guidedProjectId,
  };
}
