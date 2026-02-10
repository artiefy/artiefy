import { type NextRequest, NextResponse } from 'next/server';

import { asc, eq } from 'drizzle-orm';

import {
  getLessonById,
  updateLesson,
} from '~/models/educatorsModels/lessonsModels';
import { db } from '~/server/db';
import { lessons } from '~/server/db/schema';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const LessonsId = parseInt(resolvedParams.id);
    if (isNaN(LessonsId)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    const lesson = await getLessonById(LessonsId);
    if (!lesson) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error al obtener el curso:', error);
    return NextResponse.json(
      { error: 'Error al obtener el curso' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const lessonId = parseInt(resolvedParams.id);

    if (isNaN(lessonId)) {
      return new Response(JSON.stringify({ error: 'ID de lección inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = (await req.json()) as {
      title?: string;
      description?: string;
      duration?: number;
      coverImageKey?: string;
      coverVideoKey?: string;
      resourceKey?: string;
      resourceNames?: string;
      courseId?: number;
      orderIndex?: number;
    };

    const duration =
      typeof data.duration === 'number' && !Number.isNaN(data.duration)
        ? data.duration
        : undefined;

    const desiredIndex = Number(data.orderIndex);

    if (Number.isFinite(desiredIndex)) {
      const current = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
        columns: { id: true, courseId: true },
      });

      if (!current?.courseId) {
        return new Response(
          JSON.stringify({ error: 'Lección no encontrada' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const courseId = current.courseId;
      const courseLessons = await db.query.lessons.findMany({
        where: eq(lessons.courseId, courseId),
        orderBy: [asc(lessons.orderIndex), asc(lessons.id)],
        columns: { id: true, orderIndex: true },
      });

      const list = courseLessons.filter((l) => l.id !== lessonId);
      let clampedIndex = desiredIndex;
      if (clampedIndex < 1) {
        clampedIndex = 1;
      }
      const maxIndex = list.length + 1;
      if (clampedIndex > maxIndex) {
        clampedIndex = maxIndex;
      }
      const insertPos = clampedIndex - 1;
      list.splice(insertPos, 0, { id: lessonId, orderIndex: clampedIndex });

      let position = 1;
      for (const l of list) {
        if (l.orderIndex !== position) {
          await db
            .update(lessons)
            .set({ orderIndex: position })
            .where(eq(lessons.id, l.id));
        }
        position++;
      }
    }

    const updatePayload = {
      title: data.title,
      description: data.description,
      duration,
      coverImageKey: data.coverImageKey,
      coverVideoKey: data.coverVideoKey,
      resourceKey: data.resourceKey,
      resourceNames: data.resourceNames,
      courseId:
        typeof data.courseId === 'number' && !Number.isNaN(data.courseId)
          ? data.courseId
          : undefined,
    };

    const hasUpdates = Object.values(updatePayload).some(
      (value) => value !== undefined
    );

    if (!hasUpdates) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updatedLesson = await updateLesson(lessonId, updatePayload);

    return new Response(JSON.stringify(updatedLesson), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return new Response(
      JSON.stringify({ error: 'Error al actualizar la lección' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
