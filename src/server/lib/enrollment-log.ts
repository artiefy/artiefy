import { auth } from '@clerk/nextjs/server';

import { db } from '~/server/db';
import { enrollmentLogs } from '~/server/db/schema';

import 'server-only';

// Registro de matrículas y desmatrículas en cursos (tabla enrollment_logs).
// Nunca rompe el flujo que lo llama: si la tabla no existe todavía
// (scripts/enrollment_logs.sql) o algo falla, solo se reporta en consola.

export type AccionMatricula = 'matricula' | 'desmatricula';

export async function registrarMatriculas(
  accion: AccionMatricula,
  filas: { userId: string; courseId: number }[],
  origen: string,
  detalle?: string | null
): Promise<void> {
  if (filas.length === 0) return;
  try {
    const actorId = await auth()
      .then((a) => a.userId)
      .catch(() => null);
    await db.insert(enrollmentLogs).values(
      filas.map((f) => ({
        userId: f.userId,
        courseId: f.courseId,
        accion,
        origen,
        actorId,
        detalle: detalle ?? null,
      }))
    );
  } catch (error) {
    console.error('[MATRICULAS] no se pudo registrar:', origen, error);
  }
}
