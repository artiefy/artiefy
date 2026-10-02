/**
 * /api/super-admin/grupos/[id]/hojas
 *
 * Las "hojas" de un grupo son sus cursos (grupoCursos). Los datos de cada hoja
 * (espacio, educador, horario, título) se toman del curso.
 *
 * POST   { courseId } — agrega un curso como hoja del grupo y matricula en
 *                       ese curso a todos los estudiantes de la hoja.
 * DELETE ?courseId=   — quita la hoja (y sus sesiones/asistencia de ese curso).
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  grupoAsistencia,
  grupoCursos,
  grupoEstudiantes,
  grupoSesiones,
} from '~/server/db/schema';
import { matricularEnCurso } from '~/server/lib/grupos-matricula';

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
    courseId?: number;
  } | null;
  const courseId = Number(body?.courseId);
  if (!Number.isFinite(grupoId) || !Number.isFinite(courseId)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  try {
    // Un curso por grupo (la hoja es el grupo): reemplaza el existente.
    await db.delete(grupoCursos).where(eq(grupoCursos.grupoId, grupoId));
    await db
      .insert(grupoCursos)
      .values({ grupoId, courseId })
      .onConflictDoNothing();

    // Matricula en el curso a los estudiantes de la hoja que aún no lo estén.
    // No se desmatricula del curso anterior (conservan su progreso).
    const miembros = await db
      .select({ userId: grupoEstudiantes.userId })
      .from(grupoEstudiantes)
      .where(eq(grupoEstudiantes.grupoId, grupoId));
    const matriculados = await matricularEnCurso(
      courseId,
      miembros.map((m) => m.userId)
    );

    return NextResponse.json({ ok: true, matriculados });
  } catch (error) {
    console.error('[GRUPOS] agregar hoja:', error);
    return NextResponse.json(
      { error: 'No se pudo agregar la hoja' },
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
  const courseId = Number(request.nextUrl.searchParams.get('courseId'));
  if (!Number.isFinite(grupoId) || !Number.isFinite(courseId)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  try {
    // Sesiones (y su asistencia) de esa hoja/curso dentro del grupo.
    const sesiones = await db
      .select({ id: grupoSesiones.id })
      .from(grupoSesiones)
      .where(
        and(
          eq(grupoSesiones.grupoId, grupoId),
          eq(grupoSesiones.courseId, courseId)
        )
      );
    const sesionIds = sesiones.map((s) => s.id);
    if (sesionIds.length > 0) {
      await db
        .delete(grupoAsistencia)
        .where(inArray(grupoAsistencia.sesionId, sesionIds));
      await db
        .delete(grupoSesiones)
        .where(inArray(grupoSesiones.id, sesionIds));
    }
    await db
      .delete(grupoCursos)
      .where(
        and(
          eq(grupoCursos.grupoId, grupoId),
          eq(grupoCursos.courseId, courseId)
        )
      );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[GRUPOS] eliminar hoja:', error);
    return NextResponse.json(
      { error: 'No se pudo eliminar la hoja' },
      { status: 500 }
    );
  }
}
