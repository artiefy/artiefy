import { NextResponse } from 'next/server';

import { and, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db'; // Ajusta la ruta si tu archivo db.ts está en otro lado
import { enrollments } from '~/server/db/schema';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userIds, courseId } = body;

    if (!Array.isArray(userIds) || typeof courseId !== 'number') {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Ejecutar actualización en Drizzle
    const result = await db
      .update(enrollments)
      .set({ completed: true })
      .where(
        and(
          inArray(enrollments.userId, userIds),
          eq(enrollments.courseId, courseId)
        )
      );

    return NextResponse.json(
      { success: true, updatedCount: result.rowCount ?? 0 },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al marcar como completos:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
