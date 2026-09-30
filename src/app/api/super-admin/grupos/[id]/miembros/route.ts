/**
 * /api/super-admin/grupos/[id]/miembros
 *
 * GET    ?q=  — busca estudiantes para agregar (que no estén ya en el grupo).
 * POST   { userId } — agrega un estudiante al grupo y, si la hoja tiene
 *                     curso, lo matricula en él.
 * DELETE ?userId=   — quita un estudiante del grupo.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, asc, eq, ilike, notInArray, or } from 'drizzle-orm';

import { db } from '~/server/db';
import { grupoEstudiantes, users } from '~/server/db/schema';
import { cursoDeHoja, matricularEnCurso } from '~/server/lib/grupos-matricula';

const autorizar = async () => {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  return Boolean(userId) && (role === 'super-admin' || role === 'admin');
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const grupoId = Number((await params).id);
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim();
  if (!Number.isFinite(grupoId) || q.length < 2) {
    return NextResponse.json({ estudiantes: [] });
  }

  try {
    const yaEnGrupo = await db
      .select({ userId: grupoEstudiantes.userId })
      .from(grupoEstudiantes)
      .where(eq(grupoEstudiantes.grupoId, grupoId));
    const excluir = yaEnGrupo.map((m) => m.userId);

    const condiciones = [
      eq(users.role, 'estudiante'),
      or(
        ilike(users.name, `%${q}%`),
        ilike(users.email, `%${q}%`),
        ilike(users.identificacionNumero, `%${q}%`)
      ),
    ];
    if (excluir.length > 0) condiciones.push(notInArray(users.id, excluir));

    const estudiantes = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        identificacionNumero: users.identificacionNumero,
        modalidad: users.modalidad,
        programa: users.programa,
      })
      .from(users)
      .where(and(...condiciones))
      .orderBy(asc(users.name))
      .limit(15);

    return NextResponse.json({ estudiantes });
  } catch (error) {
    console.error('[GRUPOS] buscar miembros:', error);
    return NextResponse.json(
      { error: 'Error en la búsqueda' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const grupoId = Number((await params).id);
  const body = (await request.json().catch(() => null)) as {
    userId?: string;
    userIds?: string[];
  } | null;

  // Acepta un solo userId o un lote userIds (agregar por filtros).
  const ids = Array.from(
    new Set(
      [body?.userId, ...(body?.userIds ?? [])]
        .map((v) => (typeof v === 'string' ? v.trim() : ''))
        .filter(Boolean)
    )
  );

  if (!Number.isFinite(grupoId) || ids.length === 0) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  try {
    await db
      .insert(grupoEstudiantes)
      .values(ids.map((userId) => ({ grupoId, userId })))
      .onConflictDoNothing();

    // Si la hoja ya tiene curso, los nuevos miembros quedan matriculados.
    const courseId = await cursoDeHoja(grupoId);
    const matriculados =
      courseId != null ? await matricularEnCurso(courseId, ids) : 0;

    return NextResponse.json({ ok: true, agregados: ids.length, matriculados });
  } catch (error) {
    console.error('[GRUPOS] agregar miembro:', error);
    return NextResponse.json({ error: 'No se pudo agregar' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const grupoId = Number((await params).id);
  const body = (await request.json().catch(() => null)) as {
    userId?: string;
    modalidad?: string | null;
    observaciones?: string | null;
  } | null;
  const userId = body?.userId?.trim();
  if (!Number.isFinite(grupoId) || !userId) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const limpiar = (v: unknown) =>
    typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : null;
  const cambios: Record<string, unknown> = {};
  if (body?.modalidad !== undefined)
    cambios.modalidad = limpiar(body.modalidad);
  if (body?.observaciones !== undefined)
    cambios.observaciones = limpiar(body.observaciones);
  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ ok: true });
  }

  try {
    await db
      .update(grupoEstudiantes)
      .set(cambios)
      .where(
        and(
          eq(grupoEstudiantes.grupoId, grupoId),
          eq(grupoEstudiantes.userId, userId)
        )
      );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[GRUPOS] patch nota miembro:', error);
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const grupoId = Number((await params).id);
  const quitarUserId = request.nextUrl.searchParams.get('userId');
  if (!Number.isFinite(grupoId) || !quitarUserId) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  try {
    await db
      .delete(grupoEstudiantes)
      .where(
        and(
          eq(grupoEstudiantes.grupoId, grupoId),
          eq(grupoEstudiantes.userId, quitarUserId)
        )
      );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[GRUPOS] quitar miembro:', error);
    return NextResponse.json({ error: 'No se pudo quitar' }, { status: 500 });
  }
}
