import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

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

    // 1. Actualiza todos los orderIndex a valores temporales fuera de rango para evitar colisiones
    const tempOffset = 10000;
    for (const lesson of lessonIds) {
      await db
        .update(lessons)
        .set({ orderIndex: lesson.orderIndex + tempOffset })
        .where(eq(lessons.id, lesson.id));
    }

    // 2. Asigna los orderIndex definitivos
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
