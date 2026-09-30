/**
 * POST /api/super-admin/grupos/[id]/programa
 *
 * Asigna un programa a la hoja y "matricula" a sus estudiantes en ese programa
 * (actualiza users.programa de todos los miembros de la hoja).
 *
 * Body: { programa: string }
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { grupoEstudiantes, grupos, users } from '~/server/db/schema';

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
    // Programa de la hoja.
    await db
      .update(grupos)
      .set({ programa, updatedAt: new Date() })
      .where(eq(grupos.id, grupoId));

    // Matricula (asigna el programa) a los estudiantes de la hoja.
    const miembros = await db
      .select({ userId: grupoEstudiantes.userId })
      .from(grupoEstudiantes)
      .where(eq(grupoEstudiantes.grupoId, grupoId));
    const ids = miembros.map((m) => m.userId);
    if (ids.length > 0) {
      await db
        .update(users)
        .set({ programa, updatedAt: new Date() })
        .where(inArray(users.id, ids));
    }

    return NextResponse.json({ ok: true, matriculados: ids.length });
  } catch (error) {
    console.error('[GRUPOS] asignar programa:', error);
    return NextResponse.json(
      { error: 'No se pudo asignar el programa' },
      { status: 500 }
    );
  }
}
