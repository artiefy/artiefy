import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courseInstructors, courses } from '~/server/db/schema';

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = (await request.json()) as {
      courseId: number;
      instructors: string[];
    };

    const { courseId, instructors } = body;

    if (!courseId || !instructors || !Array.isArray(instructors)) {
      return NextResponse.json(
        { error: 'courseId e instructors son requeridos' },
        { status: 400 }
      );
    }

    if (instructors.length === 0) {
      return NextResponse.json(
        { error: 'Debe haber al menos un instructor' },
        { status: 400 }
      );
    }

    console.log('🔄 Actualizando instructores del curso:', {
      courseId,
      instructors,
    });

    // 1. Eliminar todos los instructores actuales del curso
    await db
      .delete(courseInstructors)
      .where(eq(courseInstructors.courseId, courseId));

    // 2. Insertar los nuevos instructores
    await db.insert(courseInstructors).values(
      instructors.map((instructorId) => ({
        courseId,
        instructorId,
      }))
    );

    // 3. Actualizar el campo singular `instructor` con el primero de la lista
    await db
      .update(courses)
      .set({ instructor: instructors[0] })
      .where(eq(courses.id, courseId));

    console.log('✅ Instructores actualizados correctamente');

    return NextResponse.json({
      success: true,
      message: 'Instructores actualizados',
      instructors,
    });
  } catch (error) {
    console.error('❌ Error al actualizar instructores:', error);
    return NextResponse.json(
      { error: 'Error al actualizar instructores' },
      { status: 500 }
    );
  }
}
