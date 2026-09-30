/**
 * GET /api/super-admin/grupos/[id]/clases
 *
 * Clases virtuales del curso asignado a la hoja: las mismas `class_meetings`
 * que se crean desde el detalle del curso (ModalScheduleMeeting). Una hoja
 * puede tener varias clases, cada una con su enlace de Teams.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { asc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { classMeetings } from '~/server/db/schema';
import { cursoDeHoja } from '~/server/lib/grupos-matricula';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  if (!userId || (role !== 'super-admin' && role !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const grupoId = Number((await params).id);
  if (!Number.isFinite(grupoId)) {
    return NextResponse.json({ error: 'Id inválido' }, { status: 400 });
  }

  try {
    const courseId = await cursoDeHoja(grupoId);
    if (courseId == null) {
      return NextResponse.json({ courseId: null, clases: [] });
    }

    const clases = await db
      .select({
        id: classMeetings.id,
        title: classMeetings.title,
        startDateTime: classMeetings.startDateTime,
        endDateTime: classMeetings.endDateTime,
        joinUrl: classMeetings.joinUrl,
      })
      .from(classMeetings)
      .where(eq(classMeetings.courseId, courseId))
      .orderBy(asc(classMeetings.startDateTime));

    return NextResponse.json({ courseId, clases });
  } catch (error) {
    console.error('[GRUPOS] clases del curso:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar las clases' },
      { status: 500 }
    );
  }
}
