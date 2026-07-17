'use server';

import { revalidatePath } from 'next/cache';

import { auth, currentUser } from '@clerk/nextjs/server';
import { Pool } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';

import { env } from '~/env';
import { db } from '~/server/db';
import * as schema from '~/server/db/schema';
import { users } from '~/server/db/schema';
import { hasActiveGuidedProjectEntitlement } from '~/server/services/guided-projects/guidedProjectEntitlement';
import {
  type GuidedActivityProgressResult,
  persistGuidedActivityProgress,
} from '~/server/services/guided-projects/persistGuidedActivityProgress';

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

    if (!hasActiveGuidedProjectEntitlement(clerkUser)) {
      return {
        success: false,
        message:
          'Se requiere una suscripción Pro, Premium o Enterprise activa para actualizar el progreso.',
      };
    }

    const pool = new Pool({ connectionString: env.POSTGRES_URL });
    const transactionalDb = drizzle({ client: pool, schema });
    let persistenceResult: GuidedActivityProgressResult;

    try {
      persistenceResult = await transactionalDb.transaction((tx) =>
        persistGuidedActivityProgress(tx, {
          activityId,
          isCompleted,
          userId,
        })
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
      revalidatePath(
        `/estudiantes/proyectos-guiados/${persistenceResult.guidedProjectId}/actividades/${activityId}`
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
