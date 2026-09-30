/**
 * /api/super-admin/grupos/[id]/asistencia
 *
 * POST   { fecha, titulo? }            — crea una sesión (una "clase") del grupo.
 * PUT    { sesionId, marcas: [...] }   — guarda la asistencia de una sesión.
 * PATCH  { sesionId, fecha }           — cambia la fecha de una sesión.
 * DELETE ?sesionId=                    — elimina una sesión y sus marcas.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { grupoAsistencia, grupoSesiones } from '~/server/db/schema';

const autorizar = async () => {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  return Boolean(userId) && (role === 'super-admin' || role === 'admin');
};

const ESTADOS = ['presente', 'ausente', 'tarde'] as const;
type Estado = (typeof ESTADOS)[number];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const grupoId = Number((await params).id);
  const body = (await request.json().catch(() => null)) as {
    fecha?: string;
    titulo?: string;
    courseId?: number;
  } | null;
  const fecha = body?.fecha?.trim();
  if (!Number.isFinite(grupoId) || !fecha) {
    return NextResponse.json(
      { error: 'La fecha es obligatoria' },
      { status: 400 }
    );
  }
  const courseId = Number(body?.courseId);
  try {
    const [sesion] = await db
      .insert(grupoSesiones)
      .values({
        grupoId,
        courseId: Number.isFinite(courseId) ? courseId : null,
        fecha,
        titulo: body?.titulo?.trim() ?? null,
      })
      .returning({ id: grupoSesiones.id });
    return NextResponse.json({ ok: true, id: sesion?.id });
  } catch (error) {
    console.error('[GRUPOS] crear sesión:', error);
    return NextResponse.json(
      { error: 'No se pudo crear la sesión' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const grupoId = Number((await params).id);
  const body = (await request.json().catch(() => null)) as {
    sesionId?: number;
    marcas?: { userId: string; estado: string }[];
  } | null;
  const sesionId = Number(body?.sesionId);
  if (!Number.isFinite(grupoId) || !Number.isFinite(sesionId)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  const marcas = (body?.marcas ?? []).filter(
    (m): m is { userId: string; estado: Estado } =>
      typeof m?.userId === 'string' && ESTADOS.includes(m?.estado as Estado)
  );

  try {
    for (const m of marcas) {
      await db
        .insert(grupoAsistencia)
        .values({ sesionId, userId: m.userId, estado: m.estado })
        .onConflictDoUpdate({
          target: [grupoAsistencia.sesionId, grupoAsistencia.userId],
          set: { estado: m.estado },
        });
    }
    return NextResponse.json({ ok: true, guardadas: marcas.length });
  } catch (error) {
    console.error('[GRUPOS] guardar asistencia:', error);
    return NextResponse.json(
      { error: 'No se pudo guardar la asistencia' },
      { status: 500 }
    );
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
    sesionId?: number;
    fecha?: string;
  } | null;
  const sesionId = Number(body?.sesionId);
  const fecha = body?.fecha?.trim() ?? '';
  if (
    !Number.isFinite(grupoId) ||
    !Number.isFinite(sesionId) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
  ) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  try {
    await db
      .update(grupoSesiones)
      .set({ fecha })
      .where(
        and(eq(grupoSesiones.id, sesionId), eq(grupoSesiones.grupoId, grupoId))
      );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[GRUPOS] cambiar fecha de sesión:', error);
    return NextResponse.json(
      { error: 'No se pudo cambiar la fecha' },
      { status: 500 }
    );
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
  const sesionId = Number(request.nextUrl.searchParams.get('sesionId'));
  if (!Number.isFinite(grupoId) || !Number.isFinite(sesionId)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  try {
    await db.delete(grupoSesiones).where(eq(grupoSesiones.id, sesionId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[GRUPOS] eliminar sesión:', error);
    return NextResponse.json(
      { error: 'No se pudo eliminar la sesión' },
      { status: 500 }
    );
  }
}
