import { asc, eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  academyAjustes,
  academyEspacios,
  academyHorarios,
  academyProgramas,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import { ErrorAcademia } from './academias';

import 'server-only';

// Ajustes de una academia: favicon y formulario de inscripción (logos,
// fechas de inicio y comerciales). Sin el SQL (academy_ajustes.sql) se leen
// vacíos y la academia sigue funcionando.

export interface AjustesAcademia {
  faviconKey: string | null;
  formularioLogos: string[];
  formularioFechas: string[];
  formularioComerciales: string[];
}

const VACIOS: AjustesAcademia = {
  faviconKey: null,
  formularioLogos: [],
  formularioFechas: [],
  formularioComerciales: [],
};

export async function obtenerAjustes(
  academyId: number
): Promise<AjustesAcademia> {
  const [fila] = await withRetry(() =>
    db
      .select({
        faviconKey: academyAjustes.faviconKey,
        formularioLogos: academyAjustes.formularioLogos,
        formularioFechas: academyAjustes.formularioFechas,
        formularioComerciales: academyAjustes.formularioComerciales,
      })
      .from(academyAjustes)
      .where(eq(academyAjustes.academyId, academyId))
      .limit(1)
  ).catch(() => []);
  return fila ?? VACIOS;
}

// Keys de S3 subidas con /api/upload (uploads/…).
const esKey = (v: unknown): v is string =>
  typeof v === 'string' && /^uploads\/[\w./-]{1,300}$/.test(v);

const lista = (v: unknown, max: number, valido: (s: string) => boolean) =>
  Array.isArray(v)
    ? [
        ...new Set(
          v
            .filter((x): x is string => typeof x === 'string')
            .map((x) => x.trim())
            .filter((x) => x && valido(x))
        ),
      ].slice(0, max)
    : undefined;

export async function guardarAjustes(
  academyId: number,
  body: Record<string, unknown>
) {
  const datos: Partial<AjustesAcademia> = {};
  if (body.faviconKey !== undefined) {
    if (body.faviconKey !== null && !esKey(body.faviconKey)) {
      throw new ErrorAcademia('El favicon no es válido.');
    }
    datos.faviconKey = body.faviconKey;
  }
  const logos = lista(body.formularioLogos, 6, esKey);
  if (logos) datos.formularioLogos = logos;
  const fechas = lista(body.formularioFechas, 50, (s) =>
    /^\d{4}-\d{2}-\d{2}$/.test(s)
  );
  if (fechas) datos.formularioFechas = fechas.sort();
  const comerciales = lista(
    body.formularioComerciales,
    50,
    (s) => s.length <= 120
  );
  if (comerciales) datos.formularioComerciales = comerciales;

  // SQL directo con SOLO las columnas que cambian: un insert de Drizzle
  // nombra todas las columnas de la tabla, y si falta alguna que no tiene que
  // ver (p. ej. las del correo) fallaba también el guardado del favicon.
  const entradas = Object.entries(datos) as [keyof AjustesAcademia, unknown][];
  if (entradas.length === 0) return;
  const columnas = entradas.map(([k]) => sql.identifier(COLUMNA[k]));
  const valores = entradas.map(([, v]) =>
    Array.isArray(v)
      ? sql`ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(v)}::jsonb))`
      : sql`${v}`
  );
  const actualizar = entradas.map(
    ([k]) =>
      sql`${sql.identifier(COLUMNA[k])} = EXCLUDED.${sql.identifier(COLUMNA[k])}`
  );
  await db.execute(sql`
    INSERT INTO academy_ajustes (academy_id, ${sql.join(columnas, sql`, `)})
    VALUES (${academyId}, ${sql.join(valores, sql`, `)})
    ON CONFLICT (academy_id) DO UPDATE
    SET ${sql.join(actualizar, sql`, `)}, updated_at = now()
  `);
}

const COLUMNA: Record<keyof AjustesAcademia, string> = {
  faviconKey: 'favicon_key',
  formularioLogos: 'formulario_logos',
  formularioFechas: 'formulario_fechas',
  formularioComerciales: 'formulario_comerciales',
};

/**
 * Opciones del formulario público de inscripción de la academia, con la
 * forma que espera el formulario de Artiefy (FormModal).
 */
export async function configuracionFormulario(academyId: number) {
  const [ajustes, sedes, horarios, programas] = await Promise.all([
    obtenerAjustes(academyId),
    withRetry(() =>
      db
        .select({ nombre: academyEspacios.name })
        .from(academyEspacios)
        .where(eq(academyEspacios.academyId, academyId))
        .orderBy(asc(academyEspacios.name))
    ).catch(() => []),
    withRetry(() =>
      db
        .select({ schedule: academyHorarios.name })
        .from(academyHorarios)
        .where(eq(academyHorarios.academyId, academyId))
        .orderBy(asc(academyHorarios.name))
    ).catch(() => []),
    withRetry(() =>
      db
        .select({
          id: academyProgramas.id,
          title: academyProgramas.title,
          description: academyProgramas.description,
          isActive: academyProgramas.isActive,
        })
        .from(academyProgramas)
        .where(eq(academyProgramas.academyId, academyId))
        .orderBy(asc(academyProgramas.title))
    ).catch(() => []),
  ]);
  return {
    config: {
      dates: ajustes.formularioFechas.map((startDate) => ({ startDate })),
      comercials: ajustes.formularioComerciales.map((contact) => ({ contact })),
      horarios,
      sedes,
    },
    programas: programas
      .filter((p) => p.isActive)
      .map(({ id, title, description }) => ({ id, title, description })),
    logos: ajustes.formularioLogos,
  };
}
