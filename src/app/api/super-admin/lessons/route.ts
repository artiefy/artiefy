import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import {
  getCourseIdOfLesson,
  scheduleCourseIndex,
  scheduleIndexForLesson,
} from '~/lib/embeddings/index-now';
import { autoTranscribe } from '~/lib/transcriptions/auto-transcribe';
import {
  createLesson,
  deleteLesson,
  getLessonsByCourseId,
  updateLesson,
} from '~/models/educatorsModels/lessonsModels';
import { conCacheTTL, invalidarCache } from '~/server/lib/cache-ttl';

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

async function listarClases(request: Request): Promise<NextResponse> {
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
  // Crear, editar o borrar una clase invalida la lista cacheada.
  invalidarCache('clases:');

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
    const creada = await createLesson({
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

    // La clase entra al embedding del curso al que pertenece.
    scheduleCourseIndex(Number(courseId));

    // Si la clase se creo con video, se encola su transcripcion.
    if (coverVideoKey && coverVideoKey !== 'none' && creada?.id) {
      await autoTranscribe('lesson', Number(creada.id), coverVideoKey, true);
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
  // Crear, editar o borrar una clase invalida la lista cacheada.
  invalidarCache('clases:');

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

    const videoNuevo = (updateData as { coverVideoKey?: string }).coverVideoKey;
    if (videoNuevo) {
      await autoTranscribe('lesson', Number(lessonId), videoNuevo, true);
    }

    scheduleIndexForLesson(Number(lessonId));

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
  // Crear, editar o borrar una clase invalida la lista cacheada.
  invalidarCache('clases:');

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

    // Se resuelve el curso ANTES de borrar: despues la clase ya no existe.
    const cursoDeLaClase = await getCourseIdOfLesson(Number(lessonId));
    await deleteLesson(Number(lessonId));
    if (cursoDeLaClase) scheduleCourseIndex(cursoDeLaClase);

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
  // Crear, editar o borrar una clase invalida la lista cacheada.
  invalidarCache('clases:');

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

/**
 * Vigencia de la lista de clases.
 *
 * Muy corta: se editan desde la misma pantalla. Solo sirve para que las 4-5
 * peticiones idénticas de una misma carga cuesten una sola consulta.
 */
const TTL_CLASES_MS = 20_000;

export async function GET(request: Request): Promise<NextResponse> {
  const courseId = new URL(request.url).searchParams.get('courseId') ?? '';

  try {
    const { cuerpo, estado } = await conCacheTTL<{
      cuerpo: string;
      estado: number;
    }>(`clases:${courseId}`, TTL_CLASES_MS, async () => {
      const res = await listarClases(request);
      const cuerpo = await res.text();

      if (!res.ok) {
        throw Object.assign(new Error('Fallo listando clases'), {
          cuerpo,
          estado: res.status,
        });
      }

      return { cuerpo, estado: res.status };
    });

    return new NextResponse(cuerpo, {
      status: estado,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const fallo = error as { cuerpo?: string; estado?: number };
    return new NextResponse(fallo.cuerpo ?? '{"error":"Error interno"}', {
      status: fallo.estado ?? 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
