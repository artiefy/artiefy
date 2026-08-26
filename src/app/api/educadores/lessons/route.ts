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

interface CreateLessonBody {
  title: string;
  description: string;
  courseId: number;
  duration: number;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    const body = (await req.json()) as CreateLessonBody;
    const result = await createLesson(body);

    // La clase entra al embedding del curso al que pertenece.
    if (body.courseId) scheduleCourseIndex(Number(body.courseId));

    // Clase creada con video -> se encola su transcripcion. El modal de clases
    // envia siempre a esta ruta, asi que sin esto el video quedaba guardado
    // pero nunca se transcribia.
    const videoNuevo = (body as { coverVideoKey?: string }).coverVideoKey;
    if (videoNuevo && videoNuevo !== 'none' && result?.id) {
      await autoTranscribe('lesson', Number(result.id), videoNuevo, true);
    }

    return NextResponse.json(
      {
        message: 'Lección creada exitosamente',
        id: result.id,
      },
      { status: 201 }
    );
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
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    const body = (await req.json()) as {
      lessonId: number;
      coverVideoKey?: string;
    };
    const { lessonId, coverVideoKey } = body;

    if (!lessonId) {
      return respondWithError('Se requiere el ID de la lección', 400);
    }

    // Update the lesson only if coverVideoKey is provided
    if (coverVideoKey) {
      await updateLesson(Number(lessonId), { coverVideoKey });

      // Video recien subido o reemplazado -> se encola su transcripcion.
      // `force` porque si cambiaron el video, la transcripcion vieja ya no
      // corresponde. Nunca lanza: no puede romper la subida.
      await autoTranscribe('lesson', Number(lessonId), coverVideoKey, true);

      // Se reindexa ya con lo que hay; cuando la transcripcion termine, el
      // reconcile vuelve a reindexar para incorporar lo hablado.
      scheduleIndexForLesson(Number(lessonId));
    }

    return NextResponse.json({
      message: 'Lección actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar la lección (PATCH):', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(
      `Error al actualizar la lección: ${errorMessage}`,
      500
    );
  }
}
