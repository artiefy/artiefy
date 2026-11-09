import { and, asc, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  academyCourseInstructors,
  academyCourses,
  academyEnrollments,
  academyEstudianteDatos,
  academyRolesSecundarios,
  academyUsers,
  academyUsuarioRoles,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import { ErrorAcademia } from './academias';

import 'server-only';

// "Administrador de usuarios" de una academia (igual al de Artiefy): todas
// las cuentas con sus datos (teléfono, profesión…), cursos (matriculados o
// que dicta) y roles secundarios ("Permisos").

export interface UsuarioDetalle {
  id: number;
  userId: string;
  email: string;
  name: string | null;
  role: 'super-admin' | 'educador' | 'estudiante';
  activo: boolean;
  cuentaPropia: boolean;
  createdAt: string;
  datos: Record<string, string>;
  cursos: { id: number; title: string; como: 'estudiante' | 'educador' }[];
  rolesIds: number[];
}

const opcional = <T>(promesa: Promise<T[]>): Promise<T[]> =>
  promesa.catch(() => []);

export async function listarUsuariosDetalle(
  academyId: number
): Promise<UsuarioDetalle[]> {
  const [cuentas, datos, matriculas, dicta, extra, roles] = await Promise.all([
    withRetry(() =>
      db
        .select()
        .from(academyUsers)
        .where(eq(academyUsers.academyId, academyId))
        .orderBy(asc(academyUsers.name))
    ),
    opcional(
      db
        .select({
          userId: academyEstudianteDatos.userId,
          datos: academyEstudianteDatos.datos,
        })
        .from(academyEstudianteDatos)
        .where(eq(academyEstudianteDatos.academyId, academyId))
    ),
    withRetry(() =>
      db
        .select({
          userId: academyEnrollments.userId,
          id: academyCourses.id,
          title: academyCourses.title,
        })
        .from(academyEnrollments)
        .innerJoin(
          academyCourses,
          eq(academyCourses.id, academyEnrollments.courseId)
        )
        .where(eq(academyEnrollments.academyId, academyId))
    ),
    withRetry(() =>
      db
        .select({
          userId: academyCourses.instructor,
          id: academyCourses.id,
          title: academyCourses.title,
        })
        .from(academyCourses)
        .where(eq(academyCourses.academyId, academyId))
    ),
    opcional(
      db
        .select({
          userId: academyCourseInstructors.userId,
          id: academyCourses.id,
          title: academyCourses.title,
        })
        .from(academyCourseInstructors)
        .innerJoin(
          academyCourses,
          eq(academyCourses.id, academyCourseInstructors.courseId)
        )
        .where(eq(academyCourses.academyId, academyId))
    ),
    opcional(
      db
        .select({
          academyUserId: academyUsuarioRoles.academyUserId,
          rolId: academyUsuarioRoles.rolId,
        })
        .from(academyUsuarioRoles)
        .innerJoin(
          academyRolesSecundarios,
          eq(academyRolesSecundarios.id, academyUsuarioRoles.rolId)
        )
        .where(eq(academyRolesSecundarios.academyId, academyId))
    ),
  ]);

  return cuentas.map((c) => {
    const comoEducador = [...dicta, ...extra].filter(
      (d) => d.userId === c.userId
    );
    const cursos = [
      ...matriculas
        .filter((m) => m.userId === c.userId)
        .map((m) => ({
          id: m.id,
          title: m.title,
          como: 'estudiante' as const,
        })),
      ...[...new Map(comoEducador.map((d) => [d.id, d])).values()].map((d) => ({
        id: d.id,
        title: d.title,
        como: 'educador' as const,
      })),
    ];
    return {
      id: c.id,
      userId: c.userId,
      email: c.email,
      name: c.name,
      role: c.role,
      activo: c.activo,
      cuentaPropia: c.cuentaPropia,
      createdAt: c.createdAt.toISOString(),
      datos: datos.find((d) => d.userId === c.userId)?.datos ?? {},
      cursos,
      rolesIds: roles
        .filter((r) => r.academyUserId === c.id)
        .map((r) => r.rolId),
    };
  });
}

/** Roles secundarios ("Permisos") de una cuenta: reemplaza los que tenía. */
export async function asignarRolesSecundarios(
  academyId: number,
  userId: string,
  rolIds: number[]
) {
  const [cuenta] = await db
    .select({ id: academyUsers.id })
    .from(academyUsers)
    .where(
      and(
        eq(academyUsers.academyId, academyId),
        eq(academyUsers.userId, userId)
      )
    )
    .limit(1);
  if (!cuenta)
    throw new ErrorAcademia('La cuenta no es de esta academia.', 404);

  const propios = await db
    .select({ id: academyRolesSecundarios.id })
    .from(academyRolesSecundarios)
    .where(eq(academyRolesSecundarios.academyId, academyId));
  const idsAcademia = propios.map((p) => p.id);
  const validos = rolIds.filter((id) => idsAcademia.includes(id));

  if (idsAcademia.length > 0) {
    await db
      .delete(academyUsuarioRoles)
      .where(
        and(
          eq(academyUsuarioRoles.academyUserId, cuenta.id),
          inArray(academyUsuarioRoles.rolId, idsAcademia)
        )
      );
  }
  if (validos.length > 0) {
    await db
      .insert(academyUsuarioRoles)
      .values(validos.map((rolId) => ({ rolId, academyUserId: cuenta.id })))
      .onConflictDoNothing();
  }
}
