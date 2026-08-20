/**
 * GET /api/cron/transcriptions
 *
 * Reconcilia los jobs de AWS Transcribe que quedaron pendientes: consulta su
 * estado y, cuando terminan, guarda la transcripción en Redis. Esto es lo que
 * hace que el proceso sea realmente "en segundo plano": aunque el usuario
 * cierre la página, el resultado se guarda igual.
 */

import { type NextRequest } from 'next/server';

import { env } from '~/env';
import { reconcileAllPending } from '~/lib/transcriptions/whisper-vps';

export const maxDuration = 60;

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

  try {
    const result = await reconcileAllPending();
    console.log('[TRANSCRIPCIÓN] Reconciliación completada:', result);
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error('[TRANSCRIPCIÓN] Error en el cron:', error);
    return Response.json(
      {
        error: 'Error reconciliando transcripciones',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
