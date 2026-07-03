import { NextResponse } from 'next/server';

import { and, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db'; // Ajusta la ruta si tu archivo db.ts está en otro lado
import { enrollments } from '~/server/db/schema';
import { authorizeStaff } from '~/server/utils/apiAuth';

export async function PATCH(req: Request) {
  try {
    // Security best practice: marking enrollments complete is a staff action.
    const authz = await authorizeStaff();
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado' },
        { status: authz.status }
      );
    }

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
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
