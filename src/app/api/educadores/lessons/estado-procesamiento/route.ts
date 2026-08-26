/**
 * GET /api/educadores/lessons/estado-procesamiento?lessonId=123
 *
 * Estado de lo que ocurre DESPUES de subir el video de una clase: la
 * transcripcion en el VPS y el embedding del curso. Lo consume el panel de
 * progreso del modal de clases.
 *
 * De paso reconcilia con el VPS, asi que consultarlo es lo que hace avanzar
 * la transcripcion cuando el cron no corre (en local nunca corre).
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, count, eq, isNotNull, max } from 'drizzle-orm';

import {
  getTranscriptionState,
  reconcileTranscription,
} from '~/lib/transcriptions/whisper-vps';
import { db } from '~/server/db';
import { documentEmbeddings, lessons } from '~/server/db/schema';

export async function GET(request: NextRequest) {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');

  if (
    !userId ||
    (role !== 'educador' && role !== 'admin' && role !== 'super-admin')
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const lessonId = Number(request.nextUrl.searchParams.get('lessonId'));
  if (!Number.isFinite(lessonId) || lessonId <= 0) {
    return NextResponse.json({ error: 'lessonId inválido' }, { status: 400 });
  }

  const clase = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    columns: { courseId: true, coverVideoKey: true },
  });

  if (!clase) {
    return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });
  }

  const tieneVideo = Boolean(
    clase.coverVideoKey && clase.coverVideoKey !== 'none'
  );

  // Reconciliar: si el job del VPS ya terminó, esto guarda la transcripción y
  // dispara el reindexado. Si el VPS no responde, se muestra lo último que se
  // sepa en vez de romper la respuesta.
  let estadoTranscripcion: string = tieneVideo ? 'none' : 'sin-video';
  if (tieneVideo) {
    try {
      const state = await reconcileTranscription('lesson', lessonId);
      estadoTranscripcion = state?.status ?? 'none';
    } catch {
      const state = await getTranscriptionState('lesson', lessonId);
      estadoTranscripcion = state?.status ?? 'none';
    }
  }

  // Embedding del curso al que pertenece la clase.
  let fragmentos = 0;
  let actualizado: string | null = null;

  if (clase.courseId) {
    const [fila] = await db
      .select({
        total: count(documentEmbeddings.id),
        ultimo: max(documentEmbeddings.updatedAt),
      })
      .from(documentEmbeddings)
      .where(
        and(
          eq(documentEmbeddings.courseId, Number(clase.courseId)),
          isNotNull(documentEmbeddings.courseId)
        )
      );
    fragmentos = Number(fila?.total ?? 0);
    actualizado = fila?.ultimo ? new Date(fila.ultimo).toISOString() : null;
  }

  return NextResponse.json({
    lessonId,
    courseId: clase.courseId,
    transcripcion: { estado: estadoTranscripcion },
    embedding: { fragmentos, indexado: fragmentos > 0, actualizado },
  });
}
