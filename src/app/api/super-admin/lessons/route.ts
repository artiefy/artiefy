import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import {
  createLesson,
  deleteLesson,
  getLessonsByCourseId,
  updateLesson,
} from '~/models/educatorsModels/lessonsModels';

export const dynamic = 'force-dynamic';

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const courseIdParam = url.searchParams.get('courseId');
    const courseId = courseIdParam ? parseInt(courseIdParam) : NaN; // Obtiene el courseId de los query params

    // Verifica si el courseId es válido
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    // Obtén las lecciones asociadas al curso
    const lessons = await getLessonsByCourseId(courseId);

    if (!lessons) {
      return NextResponse.json(
        { error: 'Lecciones no encontradas para este curso' },
        { status: 404 }
      );
    }

    // Devuelve las lecciones
    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error al obtener las lecciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener las lecciones' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    const body = (await req.json()) as {
      title: string;
      description: string;
      duration: number;
      coverImageKey: string;
      coverVideoKey: string;
      courseId: number;
      resourceKey: string;
      resourceNames: string;
    };

    const {
      title,
      description,
      duration,
      coverImageKey,
      coverVideoKey,
      courseId,
      resourceKey,
      resourceNames,
    } = body;

    // 1. Obtener el mayor order_index actual del curso
    const { db } = await import('~/server/db');
    const { lessons } = await import('~/server/db/schema');
    const { desc, eq } = await import('drizzle-orm');

    const lastLesson = await db.query.lessons.findFirst({
      where: eq(lessons.courseId, courseId),
      orderBy: [desc(lessons.orderIndex)],
      columns: { orderIndex: true },
    });
    const nextOrderIndex = (lastLesson?.orderIndex ?? 0) + 1;

    // 2. Asignar orderIndex a la nueva lección y pasar todos los campos explícitamente
    await createLesson({
      title,
      description,
      duration,
      coverImageKey,
      coverVideoKey,
      courseId,
      resourceKey,
      resourceNames,
      orderIndex: nextOrderIndex,
    });

    console.log('Datos recibidos en el backend:', {
      title,
      description,
      duration,
      coverImageKey, // Asegurarse de que el nombre de la columna coincida
      coverVideoKey, // Asegurarse de que el nombre de la columna coincida
      resourceKey, // Asegurarse de que el nombre de la columna coincida
      resourceNames,
      courseId,
    });

    // Si alguno de los campos importantes está ausente, devolver un error
    if (
      !title ||
      !description ||
      !duration ||
      !coverImageKey ||
      !coverVideoKey ||
      !resourceKey ||
      !courseId ||
      !resourceNames
    ) {
      console.log('Faltan campos obligatorios.');
    }

    return NextResponse.json({ status: 201 });
  } catch (error) {
    console.error('Error al crear la lección:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(`Error al crear la lección: ${errorMessage}`, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    const body = (await req.json()) as {
      lessonId: number;
    };
    const { lessonId, ...updateData } = body;

    if (!lessonId) {
      return respondWithError('Se requiere el ID de la lección', 400);
    }

    await updateLesson(Number(lessonId), updateData);

    return NextResponse.json({ message: 'Lección actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar la lección:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(
      `Error al actualizar la lección: ${errorMessage}`,
      500
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return respondWithError('Se requiere el ID de la lección', 400);
    }

    await deleteLesson(Number(lessonId));
    return NextResponse.json({ message: 'Lección eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar la lección:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(
      `Error al eliminar la lección: ${errorMessage}`,
      500
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    const body = (await req.json()) as {
      lessonId: number;
    };
    const { lessonId } = body; // Asegurarse de usar el nombre correcto

    if (!lessonId) {
      return respondWithError('Se requiere el ID de la lección', 400);
    }

    return NextResponse.json({
      message: 'Progreso de la lección actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar el progreso de la lección:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(
      `Error al actualizar el progreso de la lección: ${errorMessage}`,
      500
    );
  }
}
