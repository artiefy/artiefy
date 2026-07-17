'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { createNotification } from '~/server/actions/estudiantes/notifications/createNotification';
import { db } from '~/server/db';
import { guidedEnrollments, guidedProjects } from '~/server/db/schema';

export async function unenrollFromGuidedProject(
  guidedProjectId: number
): Promise<{ success: boolean; message: string }> {
  const user = await currentUser();
  const { userId: authUserId } = await auth();
  const userId = user?.id ?? authUserId;

  if (!userId) {
    return {
      success: false,
      message: 'Usuario no autenticado',
    };
  }

  try {
    const existingEnrollment = await db.query.guidedEnrollments.findFirst({
      where: and(
        eq(guidedEnrollments.userId, userId),
        eq(guidedEnrollments.guidedProjectId, guidedProjectId)
      ),
    });

    if (!existingEnrollment) {
      return {
        success: false,
        message: 'No estás inscrito en este proyecto guiado',
      };
    }

    // Only remove the enrollment. Activity/objective progress rows are kept so
    // re-enrolling later restores the student's advance (enroll uses
    // onConflictDoNothing), mirroring the reversible course flow.
    await db
      .delete(guidedEnrollments)
      .where(
        and(
          eq(guidedEnrollments.userId, userId),
          eq(guidedEnrollments.guidedProjectId, guidedProjectId)
        )
      );

    try {
      const project = await db.query.guidedProjects.findFirst({
        where: eq(guidedProjects.id, guidedProjectId),
      });

      await createNotification({
        userId,
        type: 'COURSE_UNENROLLMENT',
        title: 'Te has desuscrito del proyecto guiado',
        message: `Te has desuscrito del proyecto guiado ${project?.title ?? ''}`,
        metadata: { guidedProjectId },
      });
    } catch (error) {
      console.error('Error creando notificación de desuscripción:', error);
      // Continue even if the notification fails.
    }

    return {
      success: true,
      message: 'Desinscripción exitosa',
    };
  } catch (error) {
    console.error('Error al desuscribirse del proyecto guiado:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Error desconocido al desuscribirse del proyecto guiado',
    };
  }
}
