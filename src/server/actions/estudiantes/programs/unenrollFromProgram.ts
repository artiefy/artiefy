'use server';

import { currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { createNotification } from '~/server/actions/estudiantes/notifications/createNotification';
import { db } from '~/server/db';
import { enrollmentPrograms, programas } from '~/server/db/schema';

export async function unenrollFromProgram(
  programId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return {
        success: false,
        message: 'Usuario no autenticado',
      };
    }

    const result = await db
      .delete(enrollmentPrograms)
      .where(
        and(
          eq(enrollmentPrograms.userId, user.id),
          eq(enrollmentPrograms.programaId, programId)
        )
      );

    if (!result) {
      return {
        success: false,
        message: 'No se encontró la inscripción',
      };
    }

    // Obtener el nombre del programa para la notificación
    const program = await db.query.programas.findFirst({
      where: eq(programas.id, programId),
      columns: {
        title: true,
      },
    });

    // Notificación de desinscripción de programa
    await createNotification({
      userId: user.id,
      type: 'PROGRAM_ENROLLMENT',
      title: 'Te has desinscrito de un programa',
      message: program
        ? `Has cancelado tu inscripción al programa: ${program.title}`
        : 'Has cancelado tu inscripción a un programa',
      metadata: {
        programId,
      },
    });

    return {
      success: true,
      message: 'Inscripción cancelada exitosamente',
    };
  } catch (error) {
    console.error('Error en unenrollFromProgram:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
