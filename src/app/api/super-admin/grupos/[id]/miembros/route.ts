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
import { and, asc, eq, ilike, notInArray, or, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  grupoEstudiantes,
  grupoEstudiantesPendientes,
  users,
} from '~/server/db/schema';
import { rechazarSiHojaArchivada } from '~/server/lib/grupo-hoja-archivada';
import { cursoDeHoja, matricularEnCurso } from '~/server/lib/grupos-matricula';
import {
  sincronizarEstudiantesAgregados,
  sincronizarEstudiantesRetirados,
} from '~/server/lib/grupos-programas-sync';

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

    // Las cédulas se guardan con o sin separadores (1.111.482.571,
    // 1.111482571...): se comparan solo letras y dígitos en ambos lados.
    const qIdent = q.replace(/[^0-9a-z]/gi, '');
    const condiciones = [
      eq(users.role, 'estudiante'),
      or(
        ilike(users.name, `%${q}%`),
        ilike(users.email, `%${q}%`),
        ilike(users.identificacionNumero, `%${q}%`),
        qIdent.length >= 2
          ? sql`regexp_replace(${users.identificacionNumero}, '[^0-9A-Za-z]', '', 'g') ilike ${`%${qIdent}%`}`
          : undefined
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
  const rechazo = await rechazarSiHojaArchivada(grupoId);
  if (rechazo) return rechazo;
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
    await sincronizarEstudiantesAgregados(grupoId, ids);

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
  const rechazo = await rechazarSiHojaArchivada(grupoId);
  if (rechazo) return rechazo;
  const body = (await request.json().catch(() => null)) as {
    userId?: string;
    pendingId?: number;
    name?: string | null;
    identificacionNumero?: string | null;
    phone?: string | null;
    modalidad?: string | null;
    observaciones?: string | null;
  } | null;
  const pendingId = Number(body?.pendingId);
  if (
    Number.isInteger(pendingId) &&
    pendingId > 0 &&
    Number.isInteger(grupoId) &&
    grupoId > 0
  ) {
    const limpiarPendiente = (value: unknown) =>
      typeof value === 'string' && value.trim() ? value.trim() : null;
    const cambiosPendiente: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (body?.name !== undefined) {
      const name = limpiarPendiente(body.name);
      if (!name) {
        return NextResponse.json(
          { error: 'El nombre es obligatorio' },
          { status: 400 }
        );
      }
      cambiosPendiente.name = name;
    }
    if (body?.identificacionNumero !== undefined)
      cambiosPendiente.identificacionNumero = limpiarPendiente(
        body.identificacionNumero
      );
    if (body?.phone !== undefined)
      cambiosPendiente.phone = limpiarPendiente(body.phone);
    if (body?.modalidad !== undefined)
      cambiosPendiente.modalidad = limpiarPendiente(body.modalidad);
    if (body?.observaciones !== undefined)
      cambiosPendiente.observaciones = limpiarPendiente(body.observaciones);

    try {
      const actualizados = await db
        .update(grupoEstudiantesPendientes)
        .set(cambiosPendiente)
        .where(
          and(
            eq(grupoEstudiantesPendientes.id, pendingId),
            eq(grupoEstudiantesPendientes.grupoId, grupoId)
          )
        )
        .returning({ id: grupoEstudiantesPendientes.id });
      if (actualizados.length === 0) {
        return NextResponse.json(
          { error: 'Estudiante pendiente no encontrado' },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error('[GRUPOS] editar estudiante pendiente:', error);
      return NextResponse.json(
        { error: 'No se pudo guardar el estudiante pendiente' },
        { status: 500 }
      );
    }
  }

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
  const rechazo = await rechazarSiHojaArchivada(grupoId);
  if (rechazo) return rechazo;
  const pendingIdParam = request.nextUrl.searchParams.get('pendingId');
  if (pendingIdParam != null) {
    const pendingId = Number(pendingIdParam);
    if (
      !Number.isInteger(grupoId) ||
      grupoId <= 0 ||
      !Number.isInteger(pendingId) ||
      pendingId <= 0
    ) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }
    try {
      const eliminados = await db
        .delete(grupoEstudiantesPendientes)
        .where(
          and(
            eq(grupoEstudiantesPendientes.id, pendingId),
            eq(grupoEstudiantesPendientes.grupoId, grupoId)
          )
        )
        .returning({ id: grupoEstudiantesPendientes.id });
      if (eliminados.length === 0) {
        return NextResponse.json(
          { error: 'Estudiante pendiente no encontrado' },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error('[GRUPOS] quitar estudiante pendiente:', error);
      return NextResponse.json(
        { error: 'No se pudo quitar el estudiante pendiente' },
        { status: 500 }
      );
    }
  }
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
    await sincronizarEstudiantesRetirados(grupoId, [quitarUserId]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[GRUPOS] quitar miembro:', error);
    return NextResponse.json({ error: 'No se pudo quitar' }, { status: 500 });
  }
}
