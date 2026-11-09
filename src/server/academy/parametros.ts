import { and, asc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { academyParametros } from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import { ErrorAcademia } from './academias';
import { cursoDeAcademia } from './contenido';

import 'server-only';

// Parámetros de evaluación de los cursos de una academia (como los
// parametros de Artiefy): nombre, descripción, porcentaje y número de
// actividades. Los porcentajes de un curso suman 100.

const columnas = {
  id: academyParametros.id,
  courseId: academyParametros.courseId,
  name: academyParametros.name,
  description: academyParametros.description,
  porcentaje: academyParametros.porcentaje,
  numberOfActivities: academyParametros.numberOfActivities,
};

/** Todos los parámetros de la academia ("selecciona un parámetro existente"). */
export async function listarParametrosAcademia(academyId: number) {
  return withRetry(() =>
    db
      .select(columnas)
      .from(academyParametros)
      .where(eq(academyParametros.academyId, academyId))
      .orderBy(asc(academyParametros.name))
  );
}

export async function listarParametrosCurso(
  academyId: number,
  courseId: number
) {
  await cursoDeAcademia(academyId, courseId);
  return withRetry(() =>
    db
      .select(columnas)
      .from(academyParametros)
      .where(
        and(
          eq(academyParametros.academyId, academyId),
          eq(academyParametros.courseId, courseId)
        )
      )
      .orderBy(asc(academyParametros.id))
  );
}

/** Reemplaza los parámetros del curso. Vacío: el curso no es calificable. */
export async function guardarParametrosCurso(
  academyId: number,
  courseId: number,
  body: unknown
) {
  await cursoDeAcademia(academyId, courseId);
  const lista = Array.isArray(body) ? body : [];
  const parametros = lista.map((p: Record<string, unknown>) => {
    const name = typeof p?.name === 'string' ? p.name.trim() : '';
    const porcentaje = Math.round(Number(p?.porcentaje));
    const numberOfActivities = Math.round(Number(p?.numberOfActivities ?? 1));
    if (!name) throw new ErrorAcademia('Cada parámetro necesita un nombre.');
    if (!Number.isFinite(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
      throw new ErrorAcademia('El porcentaje debe estar entre 1 y 100.');
    }
    return {
      academyId,
      courseId,
      name,
      description:
        typeof p?.description === 'string' ? p.description.trim() : '',
      porcentaje,
      numberOfActivities:
        Number.isFinite(numberOfActivities) && numberOfActivities > 0
          ? numberOfActivities
          : 1,
    };
  });
  const suma = parametros.reduce((acc, p) => acc + p.porcentaje, 0);
  if (parametros.length > 0 && suma !== 100) {
    throw new ErrorAcademia('La suma de los porcentajes debe ser igual a 100%');
  }
  await db
    .delete(academyParametros)
    .where(
      and(
        eq(academyParametros.academyId, academyId),
        eq(academyParametros.courseId, courseId)
      )
    );
  if (parametros.length > 0) {
    await db.insert(academyParametros).values(parametros);
  }
}
