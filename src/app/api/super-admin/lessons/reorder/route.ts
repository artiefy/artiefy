import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq, inArray } from 'drizzle-orm'; // ...added inArray
import { sql } from 'drizzle-orm'; // <-- needed for COALESCE

import { db } from '~/server/db';
import { lessons } from '~/server/db/schema';

export async function POST(req: Request) {
  try {
    // Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Validar body
    const body = await req.json();
    const { lessonIds } = body as {
      lessonIds: { id: number; orderIndex: number }[];
    };

    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Formato inválido' },
        { status: 400 }
      );
    }

    // Determinar courseId a partir de los lesson ids (asumimos same course)
    const ids = lessonIds.map((l) => l.id);
    const first = await db
      .select({ courseId: lessons.courseId })
      .from(lessons)
      .where(inArray(lessons.id, ids))
      .limit(1)
      .then((r) => r[0]);

    if (!first) {
      return NextResponse.json(
        { success: false, error: 'Lección no encontrada' },
        { status: 404 }
      );
    }
    const courseId = first.courseId;

    // Calcular tempOffset seguro: mayor que el max orderIndex actual para evitar colisiones
    const maxRow = await db
      .select({
        maxOrder: sql<number>`COALESCE(MAX(${lessons.orderIndex}), 0)`,
      })
      .from(lessons)
      .where(eq(lessons.courseId, courseId));

    const maxOrder = maxRow?.[0]?.maxOrder ?? 0;
    const tempOffset = Number(maxOrder) + 100000; // suficientemente grande para evitar colisiones

    // 1. Actualiza los orderIndex a valores temporales (dentro del mismo curso y sólo para los ids enviados)
    for (const lesson of lessonIds) {
      await db
        .update(lessons)
        .set({ orderIndex: lesson.orderIndex + tempOffset })
        .where(eq(lessons.id, lesson.id));
    }

    // 2. Asigna los orderIndex definitivos (sin usar condiciones que puedan colisionar)
    for (const lesson of lessonIds) {
      await db
        .update(lessons)
        .set({ orderIndex: lesson.orderIndex })
        .where(eq(lessons.id, lesson.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordenando lecciones:', error);
    return NextResponse.json(
      { success: false, error: 'Error al reordenar lecciones' },
      { status: 500 }
    );
  }
}
