/**
 * GET /api/cron/transcriptions
 *
 * Hace dos cosas en cada corrida:
 *
 * 1. RECONCILIA los jobs pendientes: consulta su estado en el VPS y, cuando
 *    terminan, guarda la transcripción en Redis. Esto es lo que hace que el
 *    proceso sea realmente "en segundo plano": aunque el usuario cierre la
 *    página, el resultado se guarda igual.
 *
 * 2. ENCOLA automáticamente los videos subidos hace poco que todavía no
 *    tienen transcripción. Así no hace falta apretar ningún botón: subir un
 *    video a una clase, a un proyecto guiado o a una actividad alcanza.
 *
 * El paso 2 mira solo las últimas 24 horas a propósito. Sin ese filtro, la
 * primera corrida encolaría el catálogo histórico completo (cientos de
 * videos), que son días de proceso en el VPS y no es lo que se busca acá.
 */

import { type NextRequest } from 'next/server';

import { env } from '~/env';
import { findRecentVideos } from '~/lib/transcriptions/content-sources';
import { reindexAfterTranscription } from '~/lib/transcriptions/reindex-on-complete';
import {
  hasTranscription,
  isTranscriptionServiceConfigured,
  reconcileAllPending,
  startTranscription,
} from '~/lib/transcriptions/whisper-vps';

export const maxDuration = 60;

/**
 * Cuántos videos nuevos se encolan por corrida. El VPS procesa de a uno, así
 * que encolar cientos de golpe no acelera nada y sí llena la cola.
 */
const MAX_AUTO_POR_CORRIDA = 5;

async function encolarNuevos(): Promise<{
  candidatos: number;
  encolados: number;
}> {
  const videos = await findRecentVideos(24);
  let encolados = 0;

  for (const video of videos) {
    if (encolados >= MAX_AUTO_POR_CORRIDA) break;

    // `startTranscription` ya devuelve null si hay un job en curso, pero se
    // consulta la transcripción antes para no pedirle nada al VPS de más.
    if (await hasTranscription(video.type, video.contentId)) continue;

    try {
      const job = await startTranscription(
        video.type,
        video.contentId,
        video.videoKey
      );
      if (job) {
        encolados++;
        console.log(
          `[TRANSCRIPCIÓN] Auto-encolado ${video.type}:${video.contentId} (${video.title})`
        );
      }
    } catch (error) {
      // Que falle uno no debe detener el barrido.
      console.error(
        `[TRANSCRIPCIÓN] No se pudo auto-encolar ${video.type}:${video.contentId}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return { candidatos: videos.length, encolados };
}

export async function GET(request: NextRequest) {
  const cronSecret = env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret) {
    return Response.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Invalid authorization' }, { status: 401 });
  }

  if (!isTranscriptionServiceConfigured()) {
    return Response.json({
      success: true,
      skipped: 'servicio de transcripción no configurado',
    });
  }

  try {
    const reconciliacion = await reconcileAllPending();

    // Lo hablado en el video solo entra al embedding cuando la transcripcion
    // existe, y eso pasa AHORA, no cuando se guardo la clase. Por eso se
    // reindexa aqui el dueno de cada video que acaba de terminar.
    for (const item of reconciliacion.completedItems) {
      await reindexAfterTranscription(item.type, item.contentId);
    }

    const auto = await encolarNuevos();

    console.log('[TRANSCRIPCIÓN] Cron:', { ...reconciliacion, ...auto });

    return Response.json({ success: true, ...reconciliacion, ...auto });
  } catch (error) {
    console.error('[TRANSCRIPCIÓN] Error en el cron:', error);
    return Response.json(
      {
        error: 'Error procesando transcripciones',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
