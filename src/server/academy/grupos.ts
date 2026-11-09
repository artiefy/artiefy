import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  academyCourses,
  academyEnrollments,
  academyGrupoEstudiantes,
  academyGrupos,
  academyUsers,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import { ErrorAcademia } from './academias';

import 'server-only';

// Grupos de estudiantes de una academia. Como en Artiefy, si el grupo tiene
// curso, sus estudiantes quedan matriculados en él (academy_enrollments).

export async function listarGrupos(academyId: number) {
  const [grupos, miembros] = await Promise.all([
    withRetry(() =>
      db
        .select({
          id: academyGrupos.id,
          nombre: academyGrupos.nombre,
          courseId: academyGrupos.courseId,
          curso: academyCourses.title,
          createdAt: academyGrupos.createdAt,
        })
        .from(academyGrupos)
        .leftJoin(academyCourses, eq(academyCourses.id, academyGrupos.courseId))
        .where(eq(academyGrupos.academyId, academyId))
        .orderBy(desc(academyGrupos.createdAt))
    ),
    withRetry(() =>
      db
        .select({
          grupoId: academyGrupoEstudiantes.grupoId,
          userId: academyGrupoEstudiantes.userId,
          name: academyUsers.name,
          email: academyUsers.email,
        })
        .from(academyGrupoEstudiantes)
        .innerJoin(
          academyGrupos,
          eq(academyGrupos.id, academyGrupoEstudiantes.grupoId)
        )
        .leftJoin(
          academyUsers,
          and(
            eq(academyUsers.userId, academyGrupoEstudiantes.userId),
            eq(academyUsers.academyId, academyId)
          )
        )
        .where(eq(academyGrupos.academyId, academyId))
        .orderBy(asc(academyUsers.name))
    ),
  ]);
  return grupos.map((g) => ({
    ...g,
    estudiantes: miembros
      .filter((m) => m.grupoId === g.id)
      .map(({ userId, name, email }) => ({ userId, name, email })),
  }));
}

interface DatosGrupo {
  nombre: string;
  courseId: number | null;
  userIds: string[];
}

/** Valida el cuerpo: curso y estudiantes deben ser de la academia. */
async function validar(
  academyId: number,
  body: Record<string, unknown>
): Promise<DatosGrupo> {
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  if (!nombre) throw new ErrorAcademia('El nombre del grupo es obligatorio.');

  let courseId: number | null = null;
  if (body.courseId != null && body.courseId !== '') {
    const [curso] = await db
      .select({ id: academyCourses.id })
      .from(academyCourses)
      .where(
        and(
          eq(academyCourses.id, Number(body.courseId)),
          eq(academyCourses.academyId, academyId)
        )
      )
      .limit(1);
    if (!curso) throw new ErrorAcademia('El curso no es de esta academia.');
    courseId = curso.id;
  }

  const pedidos = Array.isArray(body.userIds)
    ? [
        ...new Set(
          body.userIds.filter((v): v is string => typeof v === 'string')
        ),
      ]
    : [];
  const validos =
    pedidos.length > 0
      ? await db
          .select({ userId: academyUsers.userId })
          .from(academyUsers)
          .where(
            and(
              eq(academyUsers.academyId, academyId),
              eq(academyUsers.role, 'estudiante'),
              inArray(academyUsers.userId, pedidos)
            )
          )
      : [];
  return { nombre, courseId, userIds: validos.map((u) => u.userId) };
}

async function guardarMiembros(
  academyId: number,
  grupoId: number,
  { courseId, userIds }: DatosGrupo
) {
  await db
    .delete(academyGrupoEstudiantes)
    .where(eq(academyGrupoEstudiantes.grupoId, grupoId));
  if (userIds.length === 0) return;
  await db
    .insert(academyGrupoEstudiantes)
    .values(userIds.map((userId) => ({ grupoId, userId })))
    .onConflictDoNothing();
  if (courseId != null) {
    await db
      .insert(academyEnrollments)
      .values(userIds.map((userId) => ({ academyId, courseId, userId })))
      .onConflictDoNothing();
  }
}

export async function crearGrupo(
  academyId: number,
  body: Record<string, unknown>
) {
  const datos = await validar(academyId, body);
  const [nuevo] = await db
    .insert(academyGrupos)
    .values({ academyId, nombre: datos.nombre, courseId: datos.courseId })
    .returning({ id: academyGrupos.id });
  await guardarMiembros(academyId, nuevo!.id, datos);
  return { id: nuevo!.id, nombre: datos.nombre };
}

async function grupoDe(academyId: number, id: number) {
  const [fila] = await db
    .select({ id: academyGrupos.id, nombre: academyGrupos.nombre })
    .from(academyGrupos)
    .where(
      and(eq(academyGrupos.id, id), eq(academyGrupos.academyId, academyId))
    )
    .limit(1);
  if (!fila) throw new ErrorAcademia('Grupo no encontrado', 404);
  return fila;
}

export async function actualizarGrupo(
  academyId: number,
  id: number,
  body: Record<string, unknown>
) {
  await grupoDe(academyId, id);
  const datos = await validar(academyId, body);
  await db
    .update(academyGrupos)
    .set({ nombre: datos.nombre, courseId: datos.courseId })
    .where(eq(academyGrupos.id, id));
  await guardarMiembros(academyId, id, datos);
  return datos.nombre;
}

/** Borra el grupo; las matrículas de sus estudiantes en el curso se conservan. */
export async function eliminarGrupo(academyId: number, id: number) {
  const grupo = await grupoDe(academyId, id);
  await db.delete(academyGrupos).where(eq(academyGrupos.id, id));
  return grupo.nombre;
}
