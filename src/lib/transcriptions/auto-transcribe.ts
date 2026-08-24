/**
 * Encolado automático de transcripciones al subir un video.
 *
 * La regla de oro acá: **esto nunca debe hacer fallar la subida**. Si el VPS
 * está caído, sin configurar o devuelve error, se registra en el log y la
 * petición original sigue su curso normal. El cron
 * (`/api/cron/transcriptions`) barre cada 5 minutos y recoge lo que se haya
 * escapado, así que perder un encolado no significa perder la transcripción.
 */

import {
  type ContentType,
  hasTranscription,
  isTranscriptionServiceConfigured,
  startTranscription,
} from './whisper-vps';

/**
 * Encola la transcripción de un video recién subido, sin bloquear ni lanzar.
 *
 * @param videoKey Key en S3, o URL completa si el video es externo.
 * @param force    Volver a transcribir aunque ya exista (p. ej. si el video
 *                 fue reemplazado por otro).
 */
export async function autoTranscribe(
  type: ContentType,
  contentId: number,
  videoKey: string | null | undefined,
  force = false
): Promise<void> {
  if (!videoKey) return;
  if (!isTranscriptionServiceConfigured()) return;

  try {
    if (!force && (await hasTranscription(type, contentId))) return;

    const job = await startTranscription(type, contentId, videoKey);
    if (job) {
      console.log(
        `[TRANSCRIPCIÓN] Encolado automático ${type}:${contentId} (${job.jobId})`
      );
    }
  } catch (error) {
    console.error(
      `[TRANSCRIPCIÓN] No se pudo encolar ${type}:${contentId} — lo tomará el cron:`,
      error instanceof Error ? error.message : error
    );
  }
}
