import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { asc } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { lessons } from '~/server/db/schema';

const bodySchema = z.object({
  orderIndex: z.number().int().positive(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const params = await ctx.params;
    const lessonId = Number(params.id);

    if (!lessonId || Number.isNaN(lessonId)) {
      return NextResponse.json(
        { error: 'ID de lección inválido' },
        { status: 400 }
      );
    }

    // Obtener la lección con datos del curso asociado
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
      with: {
        course: {
          columns: {
            id: true,
            title: true,
            description: true,
            instructor: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lección no encontrada' },
        { status: 404 }
      );
    }

    // Preparar respuesta con recursos como array si están en formato string
    let resourceNames: string[] = [];
    if (typeof lesson.resourceNames === 'string') {
      resourceNames = lesson.resourceNames
        .split(',')
        .map((name) => name.trim());
    } else if (Array.isArray(lesson.resourceNames)) {
      resourceNames = lesson.resourceNames;
    }

    const response = {
      ...lesson,
      resourceNames,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error al obtener la lección:', error);
    return NextResponse.json(
      { error: 'Error al cargar la lección' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  try {
    const idParam = ctx.params?.id;
    const lessonId = Number(idParam);
    if (!lessonId || Number.isNaN(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson id' }, { status: 400 });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }
    const desiredIndex = parsed.data.orderIndex;

    // 1) Obtener la lección y su curso
    const current = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
      columns: { id: true, courseId: true },
    });
    if (!current?.courseId) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // 2) Obtener todas las lecciones del curso ordenadas por orderIndex, id
    const courseLessons = await db.query.lessons.findMany({
      where: eq(lessons.courseId, current.courseId),
      orderBy: [asc(lessons.orderIndex), asc(lessons.id)],
      columns: { id: true, orderIndex: true },
    });
    if (!courseLessons.length) {
      return NextResponse.json(
        { error: 'No lessons to reorder' },
        { status: 400 }
      );
    }

    // 3) Mover la lección a la posición deseada (clamp entre 1..N)
    const list = courseLessons.filter((l) => l.id !== lessonId);
    const clampedIndex = Math.max(1, Math.min(desiredIndex, list.length + 1));
    const insertPos = clampedIndex - 1;
    const moved = { id: lessonId, orderIndex: clampedIndex };
    list.splice(insertPos, 0, moved);

    // 4) Resequenciar 1..N y persistir (solo si cambió)
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT /api/super-admin/lessons/[id] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
