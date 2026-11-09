import { currentUser } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { academyLogs } from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import 'server-only';

// Registro de actividad de una academia (Estudiantes › Logs).

/**
 * Anota una acción hecha por la sesión actual en la academia. Nunca rompe la
 * operación que registra: si falla (p. ej. aún no se ejecutó
 * scripts/academy_logs.sql) solo se reporta en consola.
 */
export async function registrarLog(
  academyId: number,
  accion: string,
  detalle?: string
): Promise<void> {
  try {
    const usuario = await currentUser();
    await db.insert(academyLogs).values({
      academyId,
      actorId: usuario?.id ?? null,
      actorEmail: usuario?.primaryEmailAddress?.emailAddress ?? null,
      accion,
      detalle: detalle ?? null,
    });
  } catch (error) {
    console.error('[ACADEMIAS] registrar log:', error);
  }
}

export async function listarLogs(academyId: number, limite = 300) {
  return withRetry(() =>
    db
      .select()
      .from(academyLogs)
      .where(eq(academyLogs.academyId, academyId))
      .orderBy(desc(academyLogs.createdAt))
      .limit(limite)
  );
}
