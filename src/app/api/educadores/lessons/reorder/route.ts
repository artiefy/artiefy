import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { lessons } from '~/server/db/schema';

export async function POST(req: Request) {
  try {
    // 1. Autenticación
    const { userId } = await auth();
    if (!userId) {
      console.error('No autorizado');
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // 2. Validar body
    const body = await req.json();
    const { lessonIds } = body as {
      lessonIds: { id: number; orderIndex: number }[];
    };
    console.log('Body recibido:', body);
    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      console.error('Formato inválido:', lessonIds);
      return NextResponse.json(
        { success: false, error: 'Formato inválido' },
        { status: 400 }
      );
    }

    // 3. Obtener courseId de las lecciones
    const ids = lessonIds.map((l) => l.id);
    console.log('IDs a reordenar:', ids);
    const first = await db
      .select({ courseId: lessons.courseId })
      .from(lessons)
      .where(inArray(lessons.id, ids))
      .limit(1)
      .then((r) => r[0]);
    if (!first) {
      console.error('Lección no encontrada para ids:', ids);
      return NextResponse.json(
        { success: false, error: 'Lección no encontrada' },
        { status: 404 }
      );
    }
    const courseId = first.courseId;
    console.log('courseId detectado:', courseId);

    // 4. Calcular offset temporal para evitar colisiones
    const maxRow = await db
      .select({
        maxOrder: sql<number>`COALESCE(MAX(${lessons.orderIndex}), 0)`,
      })
      .from(lessons)
      .where(eq(lessons.courseId, courseId));
    const maxOrder = maxRow?.[0]?.maxOrder ?? 0;
    const tempOffset = Number(maxOrder) + 100000;
    console.log('maxOrder:', maxOrder, 'tempOffset:', tempOffset);

    // 5. Actualizar secuencialmente (sin transacción por Neon)
    // a) Asignar orderIndex temporal
    for (const lesson of lessonIds) {
      const resTemp = await db
        .update(lessons)
        .set({ orderIndex: lesson.orderIndex + tempOffset })
        .where(eq(lessons.id, lesson.id));
      console.log(
        'Update temporal',
        lesson.id,
        '->',
        lesson.orderIndex + tempOffset,
        resTemp
      );
    }
    // b) Asignar orderIndex definitivo
    for (const lesson of lessonIds) {
      const resFinal = await db
        .update(lessons)
        .set({ orderIndex: lesson.orderIndex })
        .where(eq(lessons.id, lesson.id));
      console.log('Update final', lesson.id, '->', lesson.orderIndex, resFinal);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordenando lecciones:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Error al reordenar lecciones' },
      { status: 500 }
    );
  }
}
