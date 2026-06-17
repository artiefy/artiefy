'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@clerk/nextjs/server';
import { and, eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  guidedEnrollments,
  guidedObjectiveActivities,
  guidedObjectives,
  userGuidedActivityProgress,
  userObjectiveProgress,
} from '~/server/db/schema';

export async function updateActivityProgress({
  activityId,
  isCompleted = true,
}: {
  activityId: number;
  isCompleted?: boolean;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: 'Usuario no autenticado' };
    }

    const activity = await db.query.guidedObjectiveActivities.findFirst({
      where: eq(guidedObjectiveActivities.id, activityId),
    });

    if (!activity) {
      return { success: false, message: 'Actividad no encontrada' };
    }

    const objectiveId = activity.objectiveId;

    // Update activity progress
    await db
      .insert(userGuidedActivityProgress)
      .values({
        userId,
        activityId,
        progress: isCompleted ? 100 : 0,
        isCompleted,
        lastAttemptAt: new Date(),
        lastUpdated: new Date(),
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
          lastAttemptAt: new Date(),
          lastUpdated: new Date(),
          attemptCount: sql`${userGuidedActivityProgress.attemptCount} + 1`,
        },
      });

    // Recalculate objective progress
    const allActivities = await db.query.guidedObjectiveActivities.findMany({
      where: eq(guidedObjectiveActivities.objectiveId, objectiveId),
    });

    const userProgress = await db.query.userGuidedActivityProgress.findMany({
      where: and(eq(userGuidedActivityProgress.userId, userId)),
    });

    const completedCount = allActivities.filter((act) => {
      const prog = userProgress.find((p) => p.activityId === act.id);
      return prog?.isCompleted;
    }).length;

    const objectiveProgressPercent =
      allActivities.length > 0
        ? (completedCount / allActivities.length) * 100
        : 0;

    const isObjectiveCompleted = objectiveProgressPercent === 100;

    await db
      .insert(userObjectiveProgress)
      .values({
        userId,
        objectiveId,
        progress: objectiveProgressPercent,
        isCompleted: isObjectiveCompleted,
        isNew: false,
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          userObjectiveProgress.userId,
          userObjectiveProgress.objectiveId,
        ],
        set: {
          progress: objectiveProgressPercent,
          isCompleted: isObjectiveCompleted,
          isNew: false,
          lastUpdated: new Date(),
        },
      });

    // Check project completion
    const objective = await db.query.guidedObjectives.findFirst({
      where: eq(guidedObjectives.id, objectiveId),
    });

    if (objective) {
      const allObjectives = await db.query.guidedObjectives.findMany({
        where: eq(guidedObjectives.guidedProjectId, objective.guidedProjectId),
      });

      const allObjectiveProgress =
        await db.query.userObjectiveProgress.findMany({
          where: eq(userObjectiveProgress.userId, userId),
        });

      const allCompleted = allObjectives.every((obj) => {
        const prog = allObjectiveProgress.find((p) => p.objectiveId === obj.id);
        return prog?.isCompleted;
      });

      if (allCompleted) {
        await db
          .update(guidedEnrollments)
          .set({ completed: true })
          .where(
            and(
              eq(guidedEnrollments.userId, userId),
              eq(guidedEnrollments.guidedProjectId, objective.guidedProjectId)
            )
          );
      }
    }

    revalidatePath(
      `/estudiantes/proyectos-guiados/${objective?.guidedProjectId}`
    );

    return { success: true };
  } catch (error) {
    console.error('Error in updateActivityProgress:', error);
    return {
      success: false,
      message: 'Ocurrió un error al actualizar el progreso',
    };
  }
}
