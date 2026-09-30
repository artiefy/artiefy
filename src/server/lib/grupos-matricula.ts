import { and, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollments, grupoCursos } from '~/server/db/schema';

import 'server-only';

/**
 * Matricula en un curso a los usuarios que aún no lo estén.
 * `enrollments` no tiene restricción única, así que se filtran los existentes
 * antes de insertar para no duplicar. Devuelve cuántos se matricularon.
 */
export const matricularEnCurso = async (
  courseId: number,
  userIds: string[]
): Promise<number> => {
  if (userIds.length === 0) return 0;

  const yaMatriculados = await db
    .select({ userId: enrollments.userId })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.courseId, courseId),
        inArray(enrollments.userId, userIds)
      )
    );
  const existentes = new Set(yaMatriculados.map((e) => e.userId));
  const nuevos = userIds.filter((id) => !existentes.has(id));

  if (nuevos.length > 0) {
    await db.insert(enrollments).values(
      nuevos.map((userId) => ({
        userId,
        courseId,
        enrolledAt: new Date(),
        completed: false,
      }))
    );
  }
  return nuevos.length;
};

/** Curso asignado a la hoja (o null si no tiene). */
export const cursoDeHoja = async (grupoId: number): Promise<number | null> => {
  const [fila] = await db
    .select({ courseId: grupoCursos.courseId })
    .from(grupoCursos)
    .where(eq(grupoCursos.grupoId, grupoId))
    .limit(1);
  return fila?.courseId ?? null;
};
