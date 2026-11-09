import { and, asc, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  academyCourses,
  academyEnrollments,
  academyUsers,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import { ErrorAcademia } from './academias';

import 'server-only';

// Estudiantes de una academia (academy_users con rol estudiante) con los
// cursos de la academia en los que están matriculados (academy_enrollments).

export interface EstudianteAcademia {
  id: number;
  userId: string;
  name: string | null;
  email: string;
  activo: boolean;
  fecha: string;
  cursos: { id: number; title: string; completed: boolean }[];
}

export async function listarEstudiantes(
  academyId: number
): Promise<EstudianteAcademia[]> {
  const [estudiantes, matriculas] = await Promise.all([
    withRetry(() =>
      db
        .select()
        .from(academyUsers)
        .where(
          and(
            eq(academyUsers.academyId, academyId),
            eq(academyUsers.role, 'estudiante')
          )
        )
        .orderBy(asc(academyUsers.name))
    ),
    withRetry(() =>
      db
        .select({
          userId: academyEnrollments.userId,
          id: academyCourses.id,
          title: academyCourses.title,
          completed: academyEnrollments.completed,
        })
        .from(academyEnrollments)
        .innerJoin(
          academyCourses,
          eq(academyCourses.id, academyEnrollments.courseId)
        )
        .where(eq(academyEnrollments.academyId, academyId))
        .orderBy(asc(academyCourses.title))
    ),
  ]);

  const cursosPorUsuario = new Map<string, EstudianteAcademia['cursos']>();
  for (const { userId, ...curso } of matriculas) {
    cursosPorUsuario.set(userId, [
      ...(cursosPorUsuario.get(userId) ?? []),
      curso,
    ]);
  }

  return estudiantes.map((e) => ({
    id: e.id,
    userId: e.userId,
    name: e.name,
    email: e.email,
    activo: e.activo,
    fecha: e.createdAt.toISOString(),
    cursos: cursosPorUsuario.get(e.userId) ?? [],
  }));
}

/**
 * Matricula estudiantes de la academia en uno de sus cursos (como
 * "Matricular a Curso" de Artiefy). Ignora a quien ya esté matriculado.
 */
export async function matricularEstudiantes(
  academyId: number,
  courseId: number,
  userIds: string[]
): Promise<number> {
  const [curso] = await db
    .select({ id: academyCourses.id })
    .from(academyCourses)
    .where(
      and(
        eq(academyCourses.id, courseId),
        eq(academyCourses.academyId, academyId)
      )
    )
    .limit(1);
  if (!curso) throw new ErrorAcademia('El curso no es de esta academia.');
  const validos =
    userIds.length > 0
      ? await db
          .select({ userId: academyUsers.userId })
          .from(academyUsers)
          .where(
            and(
              eq(academyUsers.academyId, academyId),
              eq(academyUsers.role, 'estudiante'),
              inArray(academyUsers.userId, userIds)
            )
          )
      : [];
  if (validos.length === 0) {
    throw new ErrorAcademia('Selecciona estudiantes de la academia.');
  }
  const nuevas = await db
    .insert(academyEnrollments)
    .values(validos.map(({ userId }) => ({ academyId, courseId, userId })))
    .onConflictDoNothing()
    .returning({ id: academyEnrollments.id });
  return nuevas.length;
}
