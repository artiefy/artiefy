/**
 * POST /api/super-admin/transcriptions/start
 *
 * Encola transcripciones en el servicio propio de Whisper (VPS). Responde de
 * inmediato: los videos se procesan en segundo plano y el cron
 * `/api/cron/transcriptions` guarda el resultado en Redis cuando terminan.
 *
 * Body (una de estas formas):
 *   { type: 'lesson' | 'meeting' | 'project' | 'objective' | 'activity',
 *     contentId: number }        -> transcribe ese video
 *   { courseId: number }         -> clases + grabaciones de Teams del curso
 *   { projectId: number }        -> proyecto guiado, objetivos y actividades
 */

import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import {
  getCourseVideos,
  getGuidedProjectVideos,
  getSingleVideo,
  type VideoSource,
} from '~/lib/transcriptions/content-sources';
import {
  type ContentType,
  hasTranscription,
  isTranscriptionServiceConfigured,
  startTranscription,
} from '~/lib/transcriptions/whisper-vps';

interface StartBody {
  type?: ContentType;
  contentId?: number;
  courseId?: number;
  projectId?: number;
  /** Si es true, vuelve a transcribir aunque ya exista una transcripción. */
  force?: boolean;
}

export async function POST(request: Request) {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;
  if (!userId || (role !== 'admin' && role !== 'super-admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!isTranscriptionServiceConfigured()) {
    return NextResponse.json(
      {
        error:
          'El servicio de transcripción no está configurado. Falta TRANSCRIBE_API_URL o TRANSCRIBE_API_KEY.',
      },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as StartBody;
  const { type, contentId, courseId, projectId, force = false } = body;

  try {
    let videos: VideoSource[];

    if (type && contentId) {
      const single = await getSingleVideo(type, contentId);
      videos = single ? [single] : [];
    } else if (courseId) {
      videos = await getCourseVideos(courseId);
    } else if (projectId) {
      videos = await getGuidedProjectVideos(projectId);
    } else {
      return NextResponse.json(
        { error: 'Se requiere (type + contentId), courseId o projectId' },
        { status: 400 }
      );
    }

    if (videos.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron videos para transcribir' },
        { status: 404 }
      );
    }

    let started = 0;
    let skipped = 0;
    const errors: { type: ContentType; contentId: number; error: string }[] =
      [];

    for (const video of videos) {
      try {
        if (!force && (await hasTranscription(video.type, video.contentId))) {
          skipped++;
          continue;
        }

        const result = await startTranscription(
          video.type,
          video.contentId,
          video.videoKey
        );
        if (result) started++;
        else skipped++; // ya había un job en curso
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';
        // Se registra además de devolverlo: sin esto, un fallo de conexión o
        // de autenticación con el VPS queda invisible en los logs y la ruta
        // parece haber funcionado (responde 200 con started: 0).
        console.error(
          `[TRANSCRIPCIÓN] Falló el encolado de ${video.type}:${video.contentId}:`,
          message
        );
        errors.push({
          type: video.type,
          contentId: video.contentId,
          error: message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: videos.length,
      started,
      skipped,
      errors,
    });
  } catch (error) {
    console.error('[TRANSCRIPCIÓN] Error encolando jobs:', error);
    return NextResponse.json(
      {
        error: 'Error iniciando la transcripción',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
