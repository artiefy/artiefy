'use server';

import { revalidatePath } from 'next/cache';

import { auth, currentUser } from '@clerk/nextjs/server';
import { Pool } from '@neondatabase/serverless';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';

import { env } from '~/env';
import { db } from '~/server/db';
import {
  guidedEnrollments,
  guidedObjectiveActivities,
  guidedObjectives,
  userGuidedActivityProgress,
  userObjectiveProgress,
  users,
} from '~/server/db/schema';

interface PersistenceSuccess {
  success: true;
  guidedProjectId: number;
}

interface PersistenceFailure {
  success: false;
  message: string;
}

type PersistenceResult = PersistenceSuccess | PersistenceFailure;

export async function updateActivityProgress({
  activityId,
  isCompleted = true,
}: {
  activityId: number;
  isCompleted?: boolean;
}) {
  try {
    if (
      !Number.isInteger(activityId) ||
      activityId <= 0 ||
      typeof isCompleted !== 'boolean'
    ) {
      return { success: false, message: 'Datos de actividad inválidos' };
    }

    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: 'Usuario no autenticado' };
    }

    let clerkUser: Awaited<ReturnType<typeof currentUser>>;
    try {
      clerkUser = await currentUser();
    } catch {
      console.warn(
        'No se pudo verificar temporalmente la suscripción con Clerk.'
      );
      return {
        success: false,
        message:
          'No pudimos verificar tu suscripción en este momento. Intenta nuevamente.',
      };
    }

    if (!clerkUser || clerkUser.id !== userId) {
      return { success: false, message: 'Usuario no autenticado' };
    }

    const localUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true },
    });

    if (!localUser) {
      return {
        success: false,
        message: 'Usuario no encontrado en la base de datos',
      };
    }

    const userPlanType = clerkUser.publicMetadata?.planType as
      | string
      | undefined;
    const subscriptionStatus = clerkUser.publicMetadata?.subscriptionStatus as
      | string
      | undefined;
    const subscriptionEndDate = clerkUser.publicMetadata
      ?.subscriptionEndDate as string | null | undefined;
    const isSubscriptionValid =
      subscriptionStatus === 'active' &&
      (!subscriptionEndDate || new Date(subscriptionEndDate) > new Date());
    const hasValidPlan =
      userPlanType === 'Pro' ||
      userPlanType === 'Premium' ||
      userPlanType === 'Enterprise';

    if (!isSubscriptionValid || !hasValidPlan) {
      return {
        success: false,
        message:
          'Se requiere una suscripción Pro, Premium o Enterprise activa para actualizar el progreso.',
      };
    }

    const pool = new Pool({ connectionString: env.POSTGRES_URL });
    const transactionalDb = drizzle({ client: pool });
    let persistenceResult: PersistenceResult;

    try {
      persistenceResult = await transactionalDb.transaction<PersistenceResult>(
        async (tx) => {
          const [activity] = await tx
            .select({
              id: guidedObjectiveActivities.id,
              objectiveId: guidedObjectiveActivities.objectiveId,
            })
            .from(guidedObjectiveActivities)
            .where(eq(guidedObjectiveActivities.id, activityId))
            .limit(1);

          if (!activity) {
            return { success: false, message: 'Actividad no encontrada' };
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
              message: 'La actividad no pertenece a una sesión válida',
            };
          }

          if (!objective.isEnabled) {
            return { success: false, message: 'Esta sesión está bloqueada' };
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
              message: 'Debes estar inscrito en este proyecto guiado',
            };
          }

          await tx
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

          const allActivities = await tx
            .select({ id: guidedObjectiveActivities.id })
            .from(guidedObjectiveActivities)
            .where(
              eq(guidedObjectiveActivities.objectiveId, activity.objectiveId)
            );
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
            activityIds.length > 0
              ? (completedCount / activityIds.length) * 100
              : 0;
          const isObjectiveCompleted = objectiveProgressPercent === 100;

          await tx
            .insert(userObjectiveProgress)
            .values({
              userId,
              objectiveId: activity.objectiveId,
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

          const projectObjectives = await tx
            .select({ id: guidedObjectives.id })
            .from(guidedObjectives)
            .where(
              eq(guidedObjectives.guidedProjectId, objective.guidedProjectId)
            );
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
          const isProjectCompleted = objectiveIds.every((objectiveId) =>
            completedObjectiveIds.has(objectiveId)
          );

          await tx
            .update(guidedEnrollments)
            .set({ completed: isProjectCompleted })
            .where(eq(guidedEnrollments.id, enrollment.id));

          return {
            success: true,
            guidedProjectId: objective.guidedProjectId,
          };
        }
      );
    } catch (error) {
      console.error('Error al guardar el progreso del proyecto guiado:', error);
      return {
        success: false,
        message: 'No se pudo guardar el progreso. Intenta nuevamente.',
      };
    } finally {
      try {
        await pool.end();
      } catch {
        console.warn('No se pudo cerrar la conexión transaccional de Neon.');
      }
    }

    if (!persistenceResult.success) {
      return persistenceResult;
    }

    try {
      revalidatePath(
        `/estudiantes/proyectos-guiados/${persistenceResult.guidedProjectId}`
      );
    } catch {
      console.warn(
        'El progreso se guardó, pero no se pudo revalidar la vista del proyecto guiado.'
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateActivityProgress:', error);
    return {
      success: false,
      message: 'Ocurrió un error al actualizar el progreso',
    };
  }
}
