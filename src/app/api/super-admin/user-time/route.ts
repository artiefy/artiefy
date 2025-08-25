// src/app/api/super-admin/user-time/route.ts
import { NextResponse } from 'next/server';

import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db/index';
import { userTimeTracking } from '~/server/db/schema';

export async function POST(req: Request) {
  try {
    const {
      userId,
      courseId,
      elapsedMinutes = 1,
    } = (await req.json()) as {
      userId: string;
      courseId: number;
      elapsedMinutes?: number;
    };

    if (!userId || !courseId) {
      console.error('🚨 [POST] Faltan datos o formato inválido:', {
        userId,
        courseId,
      });
      return NextResponse.json(
        { error: 'Faltan datos o formato inválido' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0]; // Fecha actual YYYY-MM-DD

    // Buscar si ya existe un registro para este usuario hoy
    const existingRecord = await db
      .select({
        id: userTimeTracking.id,
        timeSpent: userTimeTracking.timeSpent,
      })
      .from(userTimeTracking)
      .where(
        and(
          eq(userTimeTracking.userId, String(userId)),
          eq(userTimeTracking.courseId, courseId),
          eq(userTimeTracking.date, today)
        )
      )
      .execute()
      .then((res) => (res.length > 0 ? res[0] : null));

    if (existingRecord) {
      // Sumar 60 segundos (1 minuto) al tiempo ya registrado
      const updatedTime = existingRecord.timeSpent + elapsedMinutes * 60;

      await db
        .update(userTimeTracking)
        .set({ timeSpent: updatedTime })
        .where(eq(userTimeTracking.id, existingRecord.id))
        .execute();
    } else {
      // Insertar un nuevo registro con 60 segundos (1 minuto)

      await db
        .insert(userTimeTracking)
        .values({
          userId,
          courseId,
          date: today,
          timeSpent: 60,
        })
        .execute();
    }

    return NextResponse.json({ message: 'Tiempo guardado correctamente' });
  } catch (error) {
    console.error('❌ [POST] Error al guardar tiempo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
