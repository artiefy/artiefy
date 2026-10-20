/**
 * POST /api/super-admin/grupos/[id]/programa
 *
 * @deprecated La UI usa PUT /grupos/[id]/programas. Se conserva por
 * compatibilidad: deja la hoja con ESE único programa (comportamiento previo)
 * pasando por la misma lógica que el endpoint nuevo, para que `grupo_programas`
 * y las matrículas no queden inconsistentes.
 *
 * Body: { programa: string }  (título del programa)
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { programas } from '~/server/db/schema';
import { establecerProgramasDeHoja } from '~/server/lib/grupos-programas-sync';

const autorizar = async () => {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  return Boolean(userId) && (role === 'super-admin' || role === 'admin');
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const grupoId = Number((await params).id);
  const body = (await request.json().catch(() => null)) as {
    programa?: string | null;
  } | null;
  const programa =
    typeof body?.programa === 'string' && body.programa.trim() !== ''
      ? body.programa.trim()
      : null;
  if (!Number.isFinite(grupoId) || !programa) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  try {
    const [prog] = await db
      .select({ id: programas.id })
      .from(programas)
      .where(eq(programas.title, programa))
      .limit(1);
    if (!prog) {
      return NextResponse.json(
        { error: 'Programa inexistente' },
        { status: 400 }
      );
    }
    const r = await establecerProgramasDeHoja(grupoId, [prog.id]);
    if (!r.ok) {
      return NextResponse.json(
        { error: 'Grupo no encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, matriculados: r.matriculados });
  } catch (error) {
    console.error('[GRUPOS] asignar programa:', error);
    return NextResponse.json(
      { error: 'No se pudo asignar el programa' },
      { status: 500 }
    );
  }
}
