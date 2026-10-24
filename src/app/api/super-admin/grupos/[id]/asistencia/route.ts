/**
 * /api/super-admin/grupos/[id]/asistencia
 *
 * POST   { fecha, titulo? }            — crea una sesión (una "clase") del grupo.
 * PUT    { sesionId, marcas: [...] }   — guarda la asistencia de una sesión.
 * PATCH  { sesionId, fecha }           — cambia la fecha de una sesión.
 * DELETE ?sesionId=                    — elimina una sesión y sus marcas.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { and, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  grupoAsistencia,
  grupoEstudiantes,
  grupoSesiones,
} from '~/server/db/schema';
import {
  educadorPuedeAccederAGrupo,
  esAdministradorDeGrupos,
} from '~/server/lib/grupo-asistencia-access';
import { getApiSession } from '~/server/utils/apiAuth';

const autorizarGrupo = async (grupoId: number, courseId?: number) => {
  const session = await getApiSession();
  if (!session.userId) return { ok: false as const, status: 401 as const };
  if (esAdministradorDeGrupos(session.role)) {
    return { ok: true as const, userId: session.userId, admin: true };
  }
  if (
    session.role !== 'educador' ||
    !(await educadorPuedeAccederAGrupo(grupoId, session.userId, courseId))
  ) {
    return { ok: false as const, status: 403 as const };
  }
  return { ok: true as const, userId: session.userId, admin: false };
};

const educadorPuedeEditarSesion = async (
  grupoId: number,
  sesionId: number,
  userId: string
) => {
  const [sesion] = await db
    .select({ courseId: grupoSesiones.courseId })
    .from(grupoSesiones)
    .where(
      and(eq(grupoSesiones.id, sesionId), eq(grupoSesiones.grupoId, grupoId))
    )
    .limit(1);
  if (!sesion) return false;
  return educadorPuedeAccederAGrupo(
    grupoId,
    userId,
    sesion.courseId ?? undefined
  );
};

const sesionPerteneceAGrupo = async (grupoId: number, sesionId: number) => {
  const [sesion] = await db
    .select({ id: grupoSesiones.id })
    .from(grupoSesiones)
    .where(
      and(eq(grupoSesiones.id, sesionId), eq(grupoSesiones.grupoId, grupoId))
    )
    .limit(1);
  return Boolean(sesion);
};

const ESTADOS = ['presente', 'ausente', 'tarde'] as const;
type Estado = (typeof ESTADOS)[number];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const courseId = body?.courseId == null ? null : Number(body.courseId);
  if (courseId != null && (!Number.isInteger(courseId) || courseId <= 0)) {
    return NextResponse.json({ error: 'courseId inválido' }, { status: 400 });
  }
  const acceso = await autorizarGrupo(grupoId, courseId ?? undefined);
  if (!acceso.ok) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: acceso.status }
    );
  }
  try {
    const [sesion] = await db
      .insert(grupoSesiones)
      .values({
        grupoId,
        courseId,
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
  const grupoId = Number((await params).id);
  const body = (await request.json().catch(() => null)) as {
    sesionId?: number;
    marcas?: { userId: string; estado: string | null }[];
  } | null;
  const sesionId = Number(body?.sesionId);
  if (!Number.isFinite(grupoId) || !Number.isFinite(sesionId)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  const acceso = await autorizarGrupo(grupoId);
  if (!acceso.ok) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: acceso.status }
    );
  }
  if (!(await sesionPerteneceAGrupo(grupoId, sesionId))) {
    return NextResponse.json(
      { error: 'Semana no encontrada' },
      { status: 404 }
    );
  }
  if (
    !acceso.admin &&
    !(await educadorPuedeEditarSesion(grupoId, sesionId, acceso.userId))
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const marcas = (body?.marcas ?? []).filter(
    (m): m is { userId: string; estado: Estado } =>
      typeof m?.userId === 'string' && ESTADOS.includes(m?.estado as Estado)
  );
  // estado '' o null = quitar la marca (volver a "sin marcar").
  const quitar = (body?.marcas ?? [])
    .filter(
      (m) =>
        typeof m?.userId === 'string' && (m.estado === '' || m.estado === null)
    )
    .map((m) => m.userId);

  try {
    const userIds = [
      ...new Set([...marcas.map((marca) => marca.userId), ...quitar]),
    ];
    const miembros =
      userIds.length === 0
        ? []
        : await db
            .select({ userId: grupoEstudiantes.userId })
            .from(grupoEstudiantes)
            .where(
              and(
                eq(grupoEstudiantes.grupoId, grupoId),
                inArray(grupoEstudiantes.userId, userIds)
              )
            );
    if (!acceso.admin && miembros.length !== userIds.length) {
      return NextResponse.json(
        { error: 'Hay estudiantes que no pertenecen a esta hoja' },
        { status: 400 }
      );
    }
    for (const m of marcas) {
      await db
        .insert(grupoAsistencia)
        .values({ sesionId, userId: m.userId, estado: m.estado })
        .onConflictDoUpdate({
          target: [grupoAsistencia.sesionId, grupoAsistencia.userId],
          set: { estado: m.estado },
        });
    }
    if (quitar.length > 0) {
      await db
        .delete(grupoAsistencia)
        .where(
          and(
            eq(grupoAsistencia.sesionId, sesionId),
            inArray(grupoAsistencia.userId, quitar)
          )
        );
    }
    return NextResponse.json({
      ok: true,
      guardadas: marcas.length,
      quitadas: quitar.length,
    });
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
  const acceso = await autorizarGrupo(grupoId);
  if (!acceso.ok) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: acceso.status }
    );
  }
  if (!(await sesionPerteneceAGrupo(grupoId, sesionId))) {
    return NextResponse.json(
      { error: 'Semana no encontrada' },
      { status: 404 }
    );
  }
  if (
    !acceso.admin &&
    !(await educadorPuedeEditarSesion(grupoId, sesionId, acceso.userId))
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
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
  const grupoId = Number((await params).id);
  const sesionId = Number(request.nextUrl.searchParams.get('sesionId'));
  if (
    !Number.isInteger(grupoId) ||
    grupoId <= 0 ||
    !Number.isInteger(sesionId) ||
    sesionId <= 0
  ) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  const acceso = await autorizarGrupo(grupoId);
  if (!acceso.ok) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: acceso.status }
    );
  }
  if (!(await sesionPerteneceAGrupo(grupoId, sesionId))) {
    return NextResponse.json(
      { error: 'Semana no encontrada' },
      { status: 404 }
    );
  }
  if (
    !acceso.admin &&
    !(await educadorPuedeEditarSesion(grupoId, sesionId, acceso.userId))
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  try {
    await db
      .delete(grupoSesiones)
      .where(
        and(eq(grupoSesiones.id, sesionId), eq(grupoSesiones.grupoId, grupoId))
      );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[GRUPOS] eliminar sesión:', error);
    return NextResponse.json(
      { error: 'No se pudo eliminar la sesión' },
      { status: 500 }
    );
  }
}
