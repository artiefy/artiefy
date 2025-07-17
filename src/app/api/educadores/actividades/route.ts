import { type NextRequest, NextResponse } from 'next/server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import { and, eq } from 'drizzle-orm';

import {
  createActivity,
  updateActivity,
} from '~/models/educatorsModels/activitiesModels';
import { db } from '~/server/db';
import {
  activities,
  lessons,
  userActivitiesProgress,
} from '~/server/db/schema';
import { ratelimit } from '~/server/ratelimit/ratelimit';

function respondWithError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// POST endpoint para crear actividades
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    // Implement rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return respondWithError('Demasiadas solicitudes', 429);
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return respondWithError(
        'No se pudo obtener información del usuario',
        500
      );
    }

    const body = (await request.json()) as {
      name: string;
      description: string;
      lessonsId: number;
      typeid: number;
      revisada: boolean;
      parametroId?: number | null;
      porcentaje: number;
      fechaMaximaEntrega: string | null;
    };

    const {
      name,
      description,
      lessonsId,
      typeid,
      revisada,
      parametroId,
      porcentaje,
      fechaMaximaEntrega,
    } = body;

    const newActivity = await createActivity({
      name,
      description,
      typeid,
      lessonsId,
      revisada,
      parametroId: revisada ? parametroId : null,
      porcentaje: revisada ? porcentaje : 0,
      fechaMaximaEntrega: fechaMaximaEntrega
        ? new Date(fechaMaximaEntrega)
        : null,
    });

    console.log('Datos enviados al servidor:', {
      name,
      description,
      lessonsId,
      typeid,
      revisada,
      parametroId,
      porcentaje,
      fechaMaximaEntrega,
    });

    return NextResponse.json({
      id: newActivity.id,
      message: 'Actividad creada exitosamente',
    });
  } catch (error) {
    console.error('Error detallado:', error);
    return respondWithError(
      `Error al crear la actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      500
    );
  }
}

// GET endpoint para obtener una actividad por ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const parametroId = searchParams.get('parametroId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID es requerido' },
        { status: 400 }
      );
    }

    // Primero obtener todas las lecciones del curso
    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, parseInt(courseId)));

    const lessonIds = courseLessons.map((lesson) => lesson.id);

    // Construir las condiciones de la consulta
    const conditions = [];

    if (lessonIds.length > 0) {
      conditions.push(eq(activities.lessonsId, lessonIds[0]));
    }

    if (parametroId) {
      conditions.push(eq(activities.parametroId, parseInt(parametroId)));
    }

    // Realizar la consulta con las condiciones
    const actividades = await db
      .select()
      .from(activities)
      .where(and(...conditions));

    return NextResponse.json(actividades);
  } catch (error) {
    console.error('Error al obtener las actividades:', error);
    return NextResponse.json(
      { error: 'Error al obtener las actividades' },
      { status: 500 }
    );
  }
}

// PUT endpoint para actualizar una actividad
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    const body = (await request.json()) as {
      id: number;
      name?: string;
      description?: string;
      typeid?: number;
      revisada?: boolean;
      fechaMaximaEntrega?: Date | null;
    };

    const { id, name, description, typeid, revisada, fechaMaximaEntrega } =
      body;

    await updateActivity(id, {
      name,
      description,
      typeid,
      revisada,
      fechaMaximaEntrega,
    });

    return NextResponse.json({
      message: 'Actividad actualizada exitosamente',
    });
  } catch (error: unknown) {
    console.error('Error al actualizar la actividad:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(
      `Error al actualizar la actividad: ${errorMessage}`,
      500
    );
  }
}

// DELETE endpoint para eliminar una actividad
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID no proporcionado' },
        { status: 400 }
      );
    }

    // Obtener la actividad para verificar su tipo
    const activity = await db
      .select()
      .from(activities)
      .where(eq(activities.id, parseInt(id)))
      .then((results) => results[0]);

    if (!activity) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      );
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Si es una actividad de tipo subida de archivos (typeid === 1)
    if (activity.typeid === 1) {
      // Obtener todas las submissions de la actividad
      const activityIndex = `activity:${id}:submissions`;
      const submissionKeys = await redis.smembers(activityIndex);

      // Eliminar cada submission
      for (const key of submissionKeys) {
        await redis.del(key);
      }

      // Eliminar el índice de submissions
      await redis.del(activityIndex);

      // Eliminar las preguntas de tipo subida de archivos
      const questionsKey = `activity:${id}:questionsFilesSubida`;
      await redis.del(questionsKey);
    }
    // Si es una actividad de tipo cuestionario (typeid === 2)
    else if (activity.typeid === 2) {
      // Eliminar preguntas de opción múltiple
      const questionsOMKey = `activity:${id}:questionsOM`;
      await redis.del(questionsOMKey);

      // Eliminar preguntas de verdadero/falso
      const questionsVOFKey = `activity:${id}:questionsVOF`;
      await redis.del(questionsVOFKey);

      // Eliminar preguntas de completar
      const questionsACompletarKey = `activity:${id}:questionsACompletar`;
      await redis.del(questionsACompletarKey);

      // Eliminar las respuestas de los estudiantes si existen
      const responsesKey = `activity:${id}:responses`;
      await redis.del(responsesKey);
    }

    // Eliminar la actividad
    await db
      .delete(userActivitiesProgress)
      .where(eq(userActivitiesProgress.activityId, parseInt(id)));

    await db.delete(activities).where(eq(activities.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar la actividad:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la actividad' },
      { status: 500 }
    );
  }
}
