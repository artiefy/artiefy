/**
 * GET /api/super-admin/grupos/opciones
 *
 * Devuelve lo necesario para el asistente de creación de grupos: programas,
 * cursos, las columnas por las que se puede filtrar y los valores distintos de
 * cada una.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { asc, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses, materias, programas } from '~/server/db/schema';
import {
  type ColumnaFiltro,
  COLUMNAS_FILTRO,
} from '~/server/lib/grupos-filtros';

/**
 * Cursos de un programa (por su título, que es lo que guarda users.programa).
 * La relación es courses ↔ materias(courseid, programaId) ↔ programas.
 */
const cursosDelPrograma = async (programaTitulo: string) => {
  const prog = await db
    .select({ id: programas.id })
    .from(programas)
    .where(eq(programas.title, programaTitulo))
    .limit(1);
  const programaId = prog[0]?.id;
  if (!programaId) return [];

  const rel = await db
    .selectDistinct({ courseid: materias.courseid })
    .from(materias)
    .where(eq(materias.programaId, programaId));
  const ids = rel
    .map((r) => r.courseid)
    .filter((v): v is number => typeof v === 'number');
  if (ids.length === 0) return [];

  return db
    .select({ id: courses.id, title: courses.title })
    .from(courses)
    .where(inArray(courses.id, ids))
    .orderBy(asc(courses.title));
};

export async function GET(request: NextRequest) {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  if (!userId || (role !== 'super-admin' && role !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Si viene ?programa=, los cursos se limitan a ese programa.
  const programaFiltro = (
    request.nextUrl.searchParams.get('programa') ?? ''
  ).trim();

  try {
    const [programasRows, cursosRows] = await Promise.all([
      // Solo programas que existen (tabla programas); users.programa guarda
      // también nombres de programas que ya se borraron o renombraron.
      db
        .selectDistinct({ v: programas.title })
        .from(programas)
        .orderBy(asc(programas.title)),
      programaFiltro
        ? cursosDelPrograma(programaFiltro)
        : db
            .select({ id: courses.id, title: courses.title })
            .from(courses)
            .orderBy(asc(courses.title)),
    ]);

    const claves = Object.keys(COLUMNAS_FILTRO) as ColumnaFiltro[];
    const listas = await Promise.all(
      claves.map((clave) => COLUMNAS_FILTRO[clave].valores())
    );
    const columnas: Record<string, string[]> = Object.fromEntries(
      claves.map((clave, i) => [clave, listas[i] ?? []])
    );

    return NextResponse.json({
      programas: programasRows
        .map((r) => r.v)
        .filter((v): v is string => !!v && v.trim() !== ''),
      cursos: cursosRows,
      columnasDisponibles: Object.entries(COLUMNAS_FILTRO).map(
        ([clave, def]) => ({
          clave,
          label: def.label,
          tipo: 'tipo' in def ? def.tipo : undefined,
        })
      ),
      valores: columnas,
    });
  } catch (error) {
    console.error('[GRUPOS] opciones:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar las opciones' },
      { status: 500 }
    );
  }
}
