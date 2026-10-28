/**
 * PATCH /api/super-admin/grupos/[id]/curso-datos
 * { courseId, title?, instructor?, scheduleOptionId?, spaceOptionId? }
 *
 * Edita los datos del CURSO asignado a la hoja desde el encabezado de la
 * planilla (igual que la edición del curso): título, educador, horario y
 * espacio. Solo actualiza los campos enviados. El cambio se refleja en el curso
 * (tabla courses) en todas las pantallas donde aparece.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courseInstructors, courses } from '~/server/db/schema';
import { rechazarSiHojaArchivada } from '~/server/lib/grupo-hoja-archivada';

const autorizar = async () => {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  return Boolean(userId) && (role === 'super-admin' || role === 'admin');
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const rechazo = await rechazarSiHojaArchivada(Number((await params).id));
  if (rechazo) return rechazo;

  const body = (await request.json().catch(() => null)) as {
    courseId?: number;
    title?: string;
    // Educador: id de usuario (elegido) o texto libre (digitado).
    instructor?: string;
    educadorTexto?: string;
    // Horario / Espacio: id de opción (elegido) o texto libre (digitado).
    scheduleOptionId?: number | null;
    horarioTexto?: string | null;
    spaceOptionId?: number | null;
    espacioTexto?: string | null;
  } | null;

  const courseId = Number(body?.courseId);
  if (!Number.isFinite(courseId)) {
    return NextResponse.json({ error: 'courseId inválido' }, { status: 400 });
  }

  try {
    // Solo los campos enviados (no reescribe el resto del curso).
    const set: Record<string, unknown> = {};
    if (typeof body?.title === 'string') set.title = body.title.trim();

    // Horario: si llega un id de opción, se usa (y se limpia el texto viejo);
    // si llega texto libre, se guarda como texto (y se limpia la opción).
    if (
      body?.scheduleOptionId !== undefined &&
      body.scheduleOptionId !== null
    ) {
      set.scheduleOptionId = body.scheduleOptionId;
      set.horario = null;
    } else if (body?.horarioTexto !== undefined) {
      set.horario = body.horarioTexto?.trim() || null;
      set.scheduleOptionId = null;
    }

    // Espacio: igual que horario.
    if (body?.spaceOptionId !== undefined && body.spaceOptionId !== null) {
      set.spaceOptionId = body.spaceOptionId;
      set.espacios = null;
    } else if (body?.espacioTexto !== undefined) {
      set.espacios = body.espacioTexto?.trim() || null;
      set.spaceOptionId = null;
    }

    // Educador elegido (id) o digitado (texto).
    const esId = typeof body?.instructor === 'string' && body.instructor.trim();
    if (esId) set.instructor = body!.instructor!.trim();
    else if (typeof body?.educadorTexto === 'string')
      set.instructor = body.educadorTexto.trim() || null;

    if (Object.keys(set).length > 0) {
      await db.update(courses).set(set).where(eq(courses.id, courseId));
    }

    // Educador: mantener la tabla intermedia (muchos-a-muchos) solo cuando es
    // un usuario real (id). Con texto libre se limpia (no hay id válido).
    if (esId) {
      await db
        .delete(courseInstructors)
        .where(eq(courseInstructors.courseId, courseId));
      await db
        .insert(courseInstructors)
        .values({ courseId, instructorId: body!.instructor!.trim() })
        .onConflictDoNothing();
    } else if (typeof body?.educadorTexto === 'string') {
      await db
        .delete(courseInstructors)
        .where(eq(courseInstructors.courseId, courseId));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[GRUPOS] curso-datos:', error);
    const mensaje =
      error instanceof Error ? error.message : 'No se pudo guardar';
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
