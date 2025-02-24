'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { db } from '~/server/db';
import { enrollments } from '~/server/db/schema';

// Desuscribirse de un curso
export async function unenrollFromCourse(courseId: number): Promise<void> {
  const user = await currentUser();

  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const userId = user.id;

  try {
    const existingEnrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      ),
    });

    if (!existingEnrollment) {
      throw new Error('No estás inscrito en este curso');
    }

    // Eliminar la inscripción del usuario en el curso
    await db
      .delete(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
      );
  } catch (error) {
    console.error('Error al desuscribirse del curso:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Error desconocido al desuscribirse del curso');
    }
  }
}
