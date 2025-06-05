'use server';

import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid'; // Add this import

import { db } from '~/server/db';
import {
  users,
  enrollments,
  lessons,
  userLessonsProgress,
} from '~/server/db/schema';

export async function enrollUserInCourse(userEmail: string, courseId: number) {
  console.log('📝 Starting enrollment process:', { userEmail, courseId });

  try {
    // Buscar específicamente el usuario con rol 'estudiante'
    let user = await db.query.users.findFirst({
      where: and(eq(users.email, userEmail), eq(users.role, 'estudiante')),
    });

    // Si no existe el usuario, crearlo
    if (!user) {
      console.log('👤 User not found, creating new user:', userEmail);
      const userId = uuidv4();

      try {
        await db.insert(users).values({
          id: userId,
          email: userEmail,
          name: userEmail.split('@')[0], // Usar la parte inicial del email como nombre
          role: 'estudiante',
          subscriptionStatus: 'inactive', // Siempre inactivo para cursos individuales
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Verificar que el usuario se creó correctamente
        user = await db.query.users.findFirst({
          where: and(eq(users.email, userEmail), eq(users.role, 'estudiante')),
        });

        if (!user) {
          throw new Error('Error al crear el usuario en la base de datos');
        }

        console.log('✅ New user created:', { id: user.id, email: user.email });
      } catch (error) {
        console.error('❌ Error creating user:', error);
        throw new Error('Error al crear el usuario en la base de datos');
      }
    }

    console.log('✅ Found student user:', {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Verificar inscripción existente con el ID correcto
    const existingEnrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, user.id),
        eq(enrollments.courseId, courseId)
      ),
    });

    if (existingEnrollment) {
      console.log('ℹ️ User already enrolled:', { userEmail, courseId });
      return { success: true, message: 'Usuario ya inscrito' };
    }

    // Crear inscripción con el ID del usuario estudiante
    await db.insert(enrollments).values({
      userId: user.id,
      courseId: courseId,
      enrolledAt: new Date(),
      completed: false,
      isPermanent: true,
    });

    // 2. Obtener lecciones
    const courseLessons = await db.query.lessons.findMany({
      where: eq(lessons.courseId, courseId),
    });

    const sortedLessons = courseLessons.sort((a, b) => {
      const match1 = /\d+/.exec(a.title);
      const match2 = /\d+/.exec(b.title);
      return (
        (match1 ? parseInt(match1[0], 10) : 0) -
        (match2 ? parseInt(match2[0], 10) : 0)
      );
    });

    // 3. Crear progreso para cada lección, verificando duplicados
    for (const [index, lesson] of sortedLessons.entries()) {
      // Verificar si ya existe un progreso para esta lección
      const existingProgress = await db.query.userLessonsProgress.findFirst({
        where: and(
          eq(userLessonsProgress.userId, user.id),
          eq(userLessonsProgress.lessonId, lesson.id)
        ),
      });

      if (!existingProgress) {
        await db.insert(userLessonsProgress).values({
          userId: user.id,
          lessonId: lesson.id,
          progress: 0,
          isCompleted: false,
          isLocked: index !== 0,
          isNew: true,
          lastUpdated: new Date(),
        });
      }
    }

    console.log('✅ Enrollment successful for student:', {
      userId: user.id,
      email: user.email,
      courseId,
    });

    return { success: true, message: 'Inscripción exitosa' };
  } catch (error) {
    console.error('❌ Enrollment error:', error);
    throw error;
  }
}
