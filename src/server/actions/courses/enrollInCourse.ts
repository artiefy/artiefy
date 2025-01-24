'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { db } from '~/server/db';
import {
  users,
  enrollments,
  lessons,
  userLessonsProgress,
} from '~/server/db/schema';

import type { Enrollment } from '~/types';

// Inscribirse en un curso
export async function enrollInCourse(courseId: number): Promise<{ success: boolean; message: string }> {
  const user = await currentUser();

  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const userId = user.id;

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      if (user.fullName && user.emailAddresses[0]?.emailAddress) {
        await db.insert(users).values({
          id: userId,
          role: 'student',
          name: user.fullName,
          email: user.emailAddresses[0].emailAddress,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        throw new Error('Información del usuario incompleta');
      }
    }

    const existingEnrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      ),
    }) as Enrollment | undefined;

    if (existingEnrollment) {
      return { success: false, message: 'Ya estás inscrito en este curso' };
    }

    const [newEnrollment] = await db
      .insert(enrollments)
      .values({
        userId,
        courseId,
        enrolledAt: new Date(),
        completed: false,
      })
      .returning();

    if (!newEnrollment) {
      return { success: false, message: 'Error al crear la inscripción' };
    }

    const firstLesson = await db.query.lessons.findFirst({
      where: and(
        eq(lessons.courseId, courseId),
        eq(lessons.order, 1)
      ),
    });

    if (firstLesson) {
      await db
        .insert(userLessonsProgress)
        .values({
          userId,
          lessonId: firstLesson.id,
          progress: 0,
          isCompleted: false,
          isLocked: false,
          lastUpdated: new Date(),
        })
        .onConflictDoUpdate({
          target: [userLessonsProgress.userId, userLessonsProgress.lessonId],
          set: {
            progress: 0,
            isCompleted: false,
            isLocked: false,
            lastUpdated: new Date(),
          },
        });
    }

    return { success: true, message: 'Inscripción exitosa' };
  } catch (error: unknown) {
    console.error('Error al inscribirse en el curso:', error);
    if (error instanceof Error) {
      return { success: false, message: `Error al inscribirse en el curso: ${error.message}` };
    } else {
      return { success: false, message: 'Error desconocido al inscribirse en el curso' };
    }
  }
}
