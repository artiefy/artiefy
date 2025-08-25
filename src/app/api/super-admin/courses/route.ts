import { type NextRequest, NextResponse } from 'next/server';

import { auth, currentUser } from '@clerk/nextjs/server';

import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  getCoursesByUserId,
  updateCourse,
} from '~/models/super-adminModels/courseModelsSuperAdmin';
import { ratelimit } from '~/server/ratelimit/ratelimit';

export const dynamic = 'force-dynamic';

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

// GET endpoint para obtener cursos
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  try {
    let courses;
    if (userId) {
      courses = await getCoursesByUserId(userId);
    } else {
      courses = await getAllCourses();
    }
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener los cursos' },
      { status: 500 }
    );
  }
}

// POST endpoint para crear cursos
export async function POST(request: NextRequest) {
  try {
    console.log('📩 Recibiendo solicitud POST para crear un curso');

    const { userId } = await auth();
    if (!userId) {
      console.error('❌ Error: Usuario no autorizado');
      return respondWithError('No autorizado', 403);
    }

    // Implement rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      console.error('❌ Error: Demasiadas solicitudes');
      return respondWithError('Demasiadas solicitudes', 429);
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      console.error('❌ Error: No se pudo obtener información del usuario');
      return respondWithError(
        'No se pudo obtener información del usuario',
        500
      );
    }

    const body = (await request.json()) as {
      title: string;
      description: string;
      coverImageKey?: string;
      categoryid: number;
      modalidadesid: number;
      nivelid: number;
      instructor?: string;
    };

    const {
      title,
      description,
      coverImageKey = '',
      categoryid,
      modalidadesid,
      nivelid,
      instructor = '',
    } = body;

    if (!title || !description || !categoryid || !modalidadesid || !nivelid) {
      console.error('❌ Error: Faltan datos obligatorios');
      return respondWithError('Faltan datos obligatorios', 400);
    }

    console.log('🛠️ Intentando crear el curso en la base de datos...');
    await createCourse({
      title,
      description,
      creatorId: userId,
      coverImageKey,
      categoryid,
      modalidadesid,
      nivelid,
      instructor,
    });
    console.log('✅ Curso creado con éxito');

    return NextResponse.json({ message: 'Curso creado exitosamente' });
  } catch (error: unknown) {
    console.error('❌ Error al crear el curso:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(`Error al crear el curso: ${errorMessage}`, 500);
  }
}

// Actualizar un curso
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    const body = (await request.json()) as {
      id: number;
      title: string;
      description: string;
      coverImageKey: string;
      categoryid: number;
      modalidadesid: number;
      nivelid: number;
      instructor: string;
    };
    const {
      id,
      title,
      description,
      coverImageKey,
      modalidadesid,
      nivelid,
      categoryid,
      instructor,
    } = body;

    const course = await getCourseById(id);
    if (!course) {
      return respondWithError('Curso no encontrado', 404);
    }

    if (course.creatorId !== userId) {
      return respondWithError('No autorizado para actualizar este curso', 403);
    }

    await updateCourse(id, {
      title,
      description,
      coverImageKey,
      categoryid,
      modalidadesid,
      instructor,
      nivelid,
    });

    return NextResponse.json({ message: 'Curso actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar el curso:', error);
    return respondWithError('Error al actualizar el curso', 500);
  }
}

// Eliminar un curso
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'ID no proporcionado' },
        { status: 400 }
      );
    }

    const parsedCourseId = parseInt(courseId);
    await deleteCourse(parsedCourseId);
    return NextResponse.json({ message: 'Curso eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el curso:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el curso' },
      { status: 500 }
    );
  }
}
