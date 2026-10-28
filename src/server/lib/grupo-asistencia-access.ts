import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { grupoCursos, grupos } from '~/server/db/schema';
import { isCourseOwnedByEducator } from '~/server/queries/educatorCourseAccess';

import type { Roles } from '~/types/globals';

export const esAdministradorDeGrupos = (role: Roles | undefined) =>
  role === 'admin' || role === 'super-admin';

export async function cursosDeGrupo(grupoId: number): Promise<number[]> {
  const [asignados, legado] = await Promise.all([
    db
      .select({ courseId: grupoCursos.courseId })
      .from(grupoCursos)
      .where(eq(grupoCursos.grupoId, grupoId)),
    db
      .select({ courseId: grupos.courseId })
      .from(grupos)
      .where(eq(grupos.id, grupoId)),
  ]);

  return [
    ...new Set(
      [
        ...asignados.map((fila) => fila.courseId),
        ...legado.map((fila) => fila.courseId),
      ].filter((courseId): courseId is number => courseId != null)
    ),
  ];
}

export async function educadorPuedeAccederAGrupo(
  grupoId: number,
  userId: string,
  cursoRequerido?: number
): Promise<boolean> {
  const courseIds = await cursosDeGrupo(grupoId);
  const candidatos = cursoRequerido
    ? courseIds.filter((courseId) => courseId === cursoRequerido)
    : courseIds;
  const permisos = await Promise.all(
    candidatos.map((courseId) => isCourseOwnedByEducator(courseId, userId))
  );
  return permisos.some(Boolean);
}
