import { and, eq, inArray, ne } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollments, grupoCursos, grupoEstudiantes } from '~/server/db/schema';
import { registrarMatriculas } from '~/server/lib/enrollment-log';

import 'server-only';

/**
 * Matricula en un curso a los usuarios que aún no lo estén.
 * `enrollments` no tiene restricción única, así que se filtran los existentes
 * antes de insertar para no duplicar. Si ya estaban matriculados pero con el
 * curso completado (al 100 %), vuelven a "actuales": al ponerlos en una hoja
 * vuelven a cursarlo. Devuelve cuántos se matricularon nuevos.
 */
export const matricularEnCurso = async (
  courseId: number,
  userIds: string[],
  // Para el registro de matrículas: desde dónde se matricula.
  origen = 'grupo: agregar a hoja'
): Promise<number> => {
  if (userIds.length === 0) return 0;

  const yaMatriculados = await db
    .select({ userId: enrollments.userId, completed: enrollments.completed })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.courseId, courseId),
        inArray(enrollments.userId, userIds)
      )
    );
  const existentes = new Set(yaMatriculados.map((e) => e.userId));
  const nuevos = userIds.filter((id) => !existentes.has(id));

  const completados = [
    ...new Set(yaMatriculados.filter((e) => e.completed).map((e) => e.userId)),
  ];
  if (completados.length > 0) {
    await db
      .update(enrollments)
      .set({ completed: false })
      .where(
        and(
          eq(enrollments.courseId, courseId),
          inArray(enrollments.userId, completados),
          eq(enrollments.completed, true)
        )
      );
    await registrarMatriculas(
      'matricula',
      completados.map((userId) => ({ userId, courseId })),
      origen,
      'volvió a actuales (estaba completado al 100 %)'
    );
  }

  if (nuevos.length > 0) {
    await db.insert(enrollments).values(
      nuevos.map((userId) => ({
        userId,
        courseId,
        enrolledAt: new Date(),
        completed: false,
      }))
    );
    await registrarMatriculas(
      'matricula',
      nuevos.map((userId) => ({ userId, courseId })),
      origen
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

/**
 * La hoja deja de tener `courseId`: desmatricula a sus estudiantes de ese curso
 * salvo a quienes otra hoja siga justificando (miembros de otra hoja con el
 * mismo curso) o tengan la matrícula marcada como permanente.
 * Devuelve cuántos se desmatricularon.
 */
export const desmatricularDeCursoDeHoja = async (
  grupoId: number,
  courseId: number
): Promise<number> => {
  const miembros = (
    await db
      .select({ userId: grupoEstudiantes.userId })
      .from(grupoEstudiantes)
      .where(eq(grupoEstudiantes.grupoId, grupoId))
  ).map((m) => m.userId);
  if (miembros.length === 0) return 0;

  const respaldados = new Set(
    (
      await db
        .select({ userId: grupoEstudiantes.userId })
        .from(grupoEstudiantes)
        .innerJoin(
          grupoCursos,
          eq(grupoCursos.grupoId, grupoEstudiantes.grupoId)
        )
        .where(
          and(
            ne(grupoEstudiantes.grupoId, grupoId),
            eq(grupoCursos.courseId, courseId),
            inArray(grupoEstudiantes.userId, miembros)
          )
        )
    ).map((r) => r.userId)
  );
  const aQuitar = miembros.filter((u) => !respaldados.has(u));
  if (aQuitar.length === 0) return 0;

  const borradas = await db
    .delete(enrollments)
    .where(
      and(
        eq(enrollments.courseId, courseId),
        inArray(enrollments.userId, aQuitar),
        eq(enrollments.isPermanent, false)
      )
    )
    .returning({ userId: enrollments.userId });
  await registrarMatriculas(
    'desmatricula',
    borradas.map((b) => ({ userId: b.userId, courseId })),
    'grupo: curso quitado o cambiado en la hoja',
    `hoja ${grupoId}`
  );
  return borradas.length;
};
