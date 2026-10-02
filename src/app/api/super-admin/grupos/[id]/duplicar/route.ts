/**
 * POST /api/super-admin/grupos/[id]/duplicar
 *
 * Crea una nueva HOJA (sub-grupo) idéntica a la actual dentro de la misma
 * familia: copia el curso y las fechas/clases, pero SIN estudiantes ni
 * asistencia (el operador agrega los estudiantes después).
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq, or } from 'drizzle-orm';

import { db } from '~/server/db';
import { grupoCursos, grupos, grupoSesiones } from '~/server/db/schema';

const autorizar = async () => {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  return {
    ok: Boolean(userId) && (role === 'super-admin' || role === 'admin'),
    userId,
  };
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { ok, userId } = await autorizar();
  if (!ok) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const grupoId = Number((await params).id);
  if (!Number.isFinite(grupoId)) {
    return NextResponse.json({ error: 'Id inválido' }, { status: 400 });
  }

  try {
    const [base] = await db
      .select()
      .from(grupos)
      .where(eq(grupos.id, grupoId))
      .limit(1);
    if (!base) {
      return NextResponse.json(
        { error: 'Grupo no encontrado' },
        { status: 404 }
      );
    }

    const familyRoot = base.parentId ?? base.id;

    // Cuántas hojas hay ya en la familia (para numerar la nueva).
    const familia = await db
      .select({ id: grupos.id })
      .from(grupos)
      .where(or(eq(grupos.id, familyRoot), eq(grupos.parentId, familyRoot)));
    const numero = familia.length + 1;

    // Nombre base sin sufijo "(n)" previo.
    const nombreBase = base.nombre.replace(/\s*\(\d+\)\s*$/, '').trim();

    const [nueva] = await db
      .insert(grupos)
      .values({
        nombre: `${nombreBase} (${numero})`,
        parentId: familyRoot,
        programa: base.programa,
        filtroColumna: base.filtroColumna,
        filtroValor: base.filtroValor,
        courseId: base.courseId,
        empresa: base.empresa,
        fechaInicio: base.fechaInicio,
        fechaFin: base.fechaFin,
        createdBy: userId,
      })
      .returning({ id: grupos.id });

    if (!nueva) {
      return NextResponse.json(
        { error: 'No se pudo crear la hoja' },
        { status: 500 }
      );
    }

    // Copia el curso (hoja) asignado.
    const cursos = await db
      .select({ courseId: grupoCursos.courseId })
      .from(grupoCursos)
      .where(eq(grupoCursos.grupoId, grupoId));
    if (cursos.length > 0) {
      await db
        .insert(grupoCursos)
        .values(
          cursos.map((c) => ({ grupoId: nueva.id, courseId: c.courseId }))
        )
        .onConflictDoNothing();
    }

    // Copia las fechas/clases (sin asistencia).
    const sesiones = await db
      .select({
        fecha: grupoSesiones.fecha,
        titulo: grupoSesiones.titulo,
        courseId: grupoSesiones.courseId,
      })
      .from(grupoSesiones)
      .where(eq(grupoSesiones.grupoId, grupoId));
    if (sesiones.length > 0) {
      await db.insert(grupoSesiones).values(
        sesiones.map((s) => ({
          grupoId: nueva.id,
          courseId: s.courseId,
          fecha: s.fecha,
          titulo: s.titulo,
        }))
      );
    }

    return NextResponse.json({ ok: true, id: nueva.id });
  } catch (error) {
    console.error('[GRUPOS] duplicar hoja:', error);
    return NextResponse.json(
      { error: 'No se pudo duplicar la hoja' },
      { status: 500 }
    );
  }
}
