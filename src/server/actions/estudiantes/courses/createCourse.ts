'use server';

import { eq } from 'drizzle-orm';

import { createNotification } from '~/server/actions/estudiantes/notifications/createNotification';
import { db } from '~/server/db';
import { courses, users } from '~/server/db/schema';

interface CreateCourseInput {
  title: string;
  description: string;
  coverImageKey: string;
  categoryid: number;
  modalidadesid: number;
  nivelid: number;
  instructor: string;
  creatorId: string;
}

export async function createCourse(input: CreateCourseInput) {
  try {
    // Create the course first
    const [newCourse] = await db
      .insert(courses)
      .values({
        ...input,
        courseTypeId: 1, // Default course type
      })
      .returning();

    // Get all students to notify them
    const students = await db.query.users.findMany({
      where: eq(users.role, 'estudiante'),
    });

    // Create notifications for all students
    const notificationPromises = students.map((student) =>
      createNotification({
        userId: student.id,
        type: 'NEW_COURSE_ADDED',
        title: '¡Nuevo Curso Disponible!',
        message: `Se ha agregado un nuevo curso: ${input.title}`,
        metadata: {
          courseId: newCourse.id,
        },
      })
    );

    await Promise.allSettled(notificationPromises);

    return {
      success: true,
      courseId: newCourse.id,
      message: 'Curso creado exitosamente',
    };
  } catch (error) {
    console.error('Error creating course:', error);
    throw new Error('Error al crear el curso');
  }
}
