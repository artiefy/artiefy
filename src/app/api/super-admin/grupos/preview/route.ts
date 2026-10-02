/**
 * POST /api/super-admin/grupos/preview
 *
 * Dado un filtro (programa + columna/valor y/o curso) devuelve los estudiantes
 * que cumplen las condiciones, para revisarlos antes de crear el grupo.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, asc, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollments, users } from '~/server/db/schema';
import { COLUMNAS_FILTRO, esColumnaValida } from '~/server/lib/grupos-filtros';

interface Cuerpo {
  programa?: string | null;
  columna?: string | null;
  valor?: string | null;
  cursoId?: number | null;
}

export async function POST(request: NextRequest) {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  if (!userId || (role !== 'super-admin' && role !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Cuerpo | null;
  if (!body) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const condiciones = [eq(users.role, 'estudiante')];

  if (body.programa) condiciones.push(eq(users.programa, body.programa));

  if (body.columna && body.valor) {
    if (!esColumnaValida(body.columna)) {
      return NextResponse.json(
        { error: 'Columna de filtro no permitida' },
        { status: 400 }
      );
    }
    condiciones.push(COLUMNAS_FILTRO[body.columna].condicion(body.valor));
  }

  // Filtro por curso: estudiantes matriculados en ese curso.
  if (body.cursoId) {
    const matriculados = await db
      .select({ userId: enrollments.userId })
      .from(enrollments)
      .where(eq(enrollments.courseId, body.cursoId));
    const ids = matriculados.map((m) => m.userId);
    if (ids.length === 0) {
      return NextResponse.json({ estudiantes: [], total: 0 });
    }
    condiciones.push(inArray(users.id, ids));
  }

  try {
    const estudiantes = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        identificacionNumero: users.identificacionNumero,
        programa: users.programa,
        sede: users.sede,
        horario: users.horario,
      })
      .from(users)
      .where(and(...condiciones))
      .orderBy(asc(users.name))
      .limit(1000);

    return NextResponse.json({ estudiantes, total: estudiantes.length });
  } catch (error) {
    console.error('[GRUPOS] preview:', error);
    return NextResponse.json(
      { error: 'No se pudo obtener la vista previa' },
      { status: 500 }
    );
  }
}
