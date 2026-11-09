import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  academyCourses,
  academyProgramaCursos,
  academyProgramas,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import { ErrorAcademia } from './academias';

import 'server-only';

// Programas de una academia: agrupan cursos de la academia.

export async function listarProgramas(academyId: number) {
  const [programas, cursos] = await Promise.all([
    withRetry(() =>
      db
        .select()
        .from(academyProgramas)
        .where(eq(academyProgramas.academyId, academyId))
        .orderBy(desc(academyProgramas.createdAt))
    ),
    withRetry(() =>
      db
        .select({
          programaId: academyProgramaCursos.programaId,
          id: academyCourses.id,
          title: academyCourses.title,
        })
        .from(academyProgramaCursos)
        .innerJoin(
          academyCourses,
          eq(academyCourses.id, academyProgramaCursos.courseId)
        )
        .where(eq(academyCourses.academyId, academyId))
        .orderBy(asc(academyCourses.title))
    ),
  ]);
  return programas.map((p) => ({
    ...p,
    cursos: cursos
      .filter((c) => c.programaId === p.id)
      .map(({ id, title }) => ({ id, title })),
  }));
}

interface DatosPrograma {
  title: string;
  description: string | null;
  isActive: boolean;
  courseIds: number[];
}

/** Valida el cuerpo; los cursos deben ser de la academia. */
async function validar(
  academyId: number,
  body: Record<string, unknown>
): Promise<DatosPrograma> {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) throw new ErrorAcademia('El nombre del programa es obligatorio.');
  const pedidos = Array.isArray(body.courseIds)
    ? [...new Set(body.courseIds.map(Number).filter(Number.isInteger))]
    : [];
  const validos =
    pedidos.length > 0
      ? await db
          .select({ id: academyCourses.id })
          .from(academyCourses)
          .where(
            and(
              eq(academyCourses.academyId, academyId),
              inArray(academyCourses.id, pedidos)
            )
          )
      : [];
  return {
    title,
    description:
      typeof body.description === 'string' && body.description.trim()
        ? body.description.trim()
        : null,
    isActive: body.isActive !== false,
    courseIds: validos.map((c) => c.id),
  };
}

async function guardarCursos(programaId: number, courseIds: number[]) {
  await db
    .delete(academyProgramaCursos)
    .where(eq(academyProgramaCursos.programaId, programaId));
  if (courseIds.length > 0) {
    await db
      .insert(academyProgramaCursos)
      .values(courseIds.map((courseId) => ({ programaId, courseId })))
      .onConflictDoNothing();
  }
}

export async function crearPrograma(
  academyId: number,
  body: Record<string, unknown>
) {
  const { courseIds, ...datos } = await validar(academyId, body);
  const [nuevo] = await db
    .insert(academyProgramas)
    .values({ academyId, ...datos })
    .returning({ id: academyProgramas.id });
  await guardarCursos(nuevo!.id, courseIds);
  return { ...nuevo!, title: datos.title };
}

async function programaDe(academyId: number, id: number) {
  const [fila] = await db
    .select({ id: academyProgramas.id, title: academyProgramas.title })
    .from(academyProgramas)
    .where(
      and(
        eq(academyProgramas.id, id),
        eq(academyProgramas.academyId, academyId)
      )
    )
    .limit(1);
  if (!fila) throw new ErrorAcademia('Programa no encontrado', 404);
  return fila;
}

export async function actualizarPrograma(
  academyId: number,
  id: number,
  body: Record<string, unknown>
) {
  await programaDe(academyId, id);
  const { courseIds, ...datos } = await validar(academyId, body);
  await db
    .update(academyProgramas)
    .set(datos)
    .where(eq(academyProgramas.id, id));
  await guardarCursos(id, courseIds);
  return datos.title;
}

export async function eliminarPrograma(academyId: number, id: number) {
  const programa = await programaDe(academyId, id);
  await db.delete(academyProgramas).where(eq(academyProgramas.id, id));
  return programa.title;
}
