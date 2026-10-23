import { type NextRequest, NextResponse } from 'next/server';

import { asc, eq, or } from 'drizzle-orm';

import { db } from '~/server/db';
import { grupoCursos, grupos } from '~/server/db/schema';
import { esAdministradorDeGrupos } from '~/server/lib/grupo-asistencia-access';
import { isCourseOwnedByEducator } from '~/server/queries/educatorCourseAccess';
import { getApiSession } from '~/server/utils/apiAuth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getApiSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  if (!esAdministradorDeGrupos(session.role) && session.role !== 'educador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const courseId = Number((await params).id);
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return NextResponse.json({ error: 'courseId inválido' }, { status: 400 });
  }
  if (
    session.role === 'educador' &&
    !(await isCourseOwnedByEducator(courseId, session.userId))
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const rows = await db
      .selectDistinct({ id: grupos.id, nombre: grupos.nombre })
      .from(grupos)
      .leftJoin(grupoCursos, eq(grupoCursos.grupoId, grupos.id))
      .where(
        or(eq(grupoCursos.courseId, courseId), eq(grupos.courseId, courseId))
      )
      .orderBy(asc(grupos.id));

    return NextResponse.json({
      groups: rows,
      canAdminister: esAdministradorDeGrupos(session.role),
    });
  } catch (error) {
    console.error('[GRUPOS] attendance context:', error);
    return NextResponse.json(
      { error: 'No se pudo consultar la hoja de asistencia' },
      { status: 500 }
    );
  }
}
