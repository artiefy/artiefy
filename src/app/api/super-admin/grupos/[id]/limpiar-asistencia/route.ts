/**
 * POST /api/super-admin/grupos/[id]/limpiar-asistencia  (solo super-admin)
 *
 * Borra todas las marcas de asistencia de la hoja. Las fechas (clases) y los
 * estudiantes se quedan. Una hoja archivada no se toca (423).
 */

import { type NextRequest, NextResponse } from 'next/server';

import { eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { grupoAsistencia, grupoSesiones } from '~/server/db/schema';
import { rechazarSiHojaArchivada } from '~/server/lib/grupo-hoja-archivada';
import { getApiSession } from '~/server/utils/apiAuth';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getApiSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  if (session.role !== 'super-admin') {
    return NextResponse.json(
      { error: 'Solo un super-admin puede limpiar la asistencia' },
      { status: 403 }
    );
  }
  const grupoId = Number((await params).id);
  if (!Number.isFinite(grupoId)) {
    return NextResponse.json({ error: 'Id inválido' }, { status: 400 });
  }
  if (await rechazarSiHojaArchivada(grupoId)) {
    return NextResponse.json(
      { error: 'La hoja está archivada' },
      { status: 423 }
    );
  }

  try {
    const sesiones = await db
      .select({ id: grupoSesiones.id })
      .from(grupoSesiones)
      .where(eq(grupoSesiones.grupoId, grupoId));
    const ids = sesiones.map((s) => s.id);
    const borradas =
      ids.length === 0
        ? []
        : await db
            .delete(grupoAsistencia)
            .where(inArray(grupoAsistencia.sesionId, ids))
            .returning({ id: grupoAsistencia.id });
    return NextResponse.json({ ok: true, borradas: borradas.length });
  } catch (error) {
    console.error('[GRUPOS] limpiar asistencia:', error);
    return NextResponse.json(
      { error: 'No se pudo limpiar la asistencia' },
      { status: 500 }
    );
  }
}
