/**
 * PUT /api/super-admin/grupos/[id]/programas
 *
 * Reemplaza la lista de programas de la hoja y sincroniza las matrículas de sus
 * estudiantes (ver `establecerProgramasDeHoja`).
 *
 * Body: { programaIds: number[] }
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { establecerProgramasDeHoja } from '~/server/lib/grupos-programas-sync';

const autorizar = async () => {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  return Boolean(userId) && (role === 'super-admin' || role === 'admin');
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const grupoId = Number((await params).id);
  const body = (await request.json().catch(() => null)) as {
    programaIds?: unknown;
  } | null;
  if (!Number.isInteger(grupoId) || !Array.isArray(body?.programaIds)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  const programaIds = body.programaIds.filter(
    (v): v is number => typeof v === 'number' && Number.isInteger(v)
  );

  try {
    const r = await establecerProgramasDeHoja(grupoId, programaIds);
    if (!r.ok) {
      return NextResponse.json(
        {
          error:
            r.error === 'grupo'
              ? 'Grupo no encontrado'
              : 'Programa inexistente',
        },
        { status: r.error === 'grupo' ? 404 : 400 }
      );
    }
    return NextResponse.json({ ok: true, matriculados: r.matriculados });
  } catch (error) {
    console.error('[GRUPOS] guardar programas:', error);
    return NextResponse.json(
      { error: 'No se pudieron guardar los programas' },
      { status: 500 }
    );
  }
}
