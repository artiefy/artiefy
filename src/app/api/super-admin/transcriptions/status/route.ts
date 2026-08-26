/**
 * GET /api/super-admin/transcriptions/status
 *
 * Devuelve el estado de las transcripciones y, de paso, reconcilia con el VPS
 * (si un job ya terminó, guarda el texto en Redis). Así la UI ve el progreso
 * sin depender solo del cron.
 *
 * Query (una de estas):
 *   ?type=lesson&contentId=123  -> estado de ese video
 *   ?courseId=702               -> clases + grabaciones de Teams del curso
 *   ?projectId=5                -> proyecto guiado, objetivos y actividades
 *   ?health=1                   -> diagnóstico del servicio del VPS
 */

import { after } from 'next/server';
import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import {
  getCourseVideos,
  getGuidedProjectVideos,
  getSingleVideo,
  type VideoSource,
} from '~/lib/transcriptions/content-sources';
import { reindexAfterTranscription } from '~/lib/transcriptions/reindex-on-complete';
import {
  checkServiceHealth,
  type ContentType,
  getTranscriptionState,
  hasTranscription,
  isTranscriptionServiceConfigured,
  reconcileTranscription,
} from '~/lib/transcriptions/whisper-vps';

interface VideoStatus {
  type: ContentType;
  contentId: number;
  title: string;
  hasTranscription: boolean;
  status: 'processing' | 'completed' | 'failed' | 'none';
  error?: string;
}

async function buildStatus(video: VideoSource): Promise<VideoStatus> {
  // Reconciliar primero: si el job terminó, esto guarda la transcripción.
  // Si el VPS está caído no debe tumbar toda la respuesta, por eso el catch.
  let state = null;
  try {
    state = await reconcileTranscription(video.type, video.contentId);

    // Si acaba de terminar, el embedding del curso o proyecto todavia no
    // contiene lo hablado en el video: se reindexa despues de responder.
    if (state?.justCompleted) {
      const { type, contentId } = video;
      after(() => reindexAfterTranscription(type, contentId));
    }
  } catch {
    state = await getTranscriptionState(video.type, video.contentId);
  }

  return {
    type: video.type,
    contentId: video.contentId,
    title: video.title,
    hasTranscription: await hasTranscription(video.type, video.contentId),
    status: state?.status ?? 'none',
    error: state?.error,
  };
}

function summarize(videos: VideoStatus[]) {
  return {
    total: videos.length,
    completed: videos.filter((v) => v.hasTranscription).length,
    processing: videos.filter((v) => v.status === 'processing').length,
    failed: videos.filter((v) => v.status === 'failed').length,
    videos,
  };
}

export async function GET(request: Request) {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;
  if (!userId || (role !== 'admin' && role !== 'super-admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  if (searchParams.get('health')) {
    return NextResponse.json(await checkServiceHealth());
  }

  if (!isTranscriptionServiceConfigured()) {
    return NextResponse.json(
      { error: 'Servicio de transcripción no configurado', configured: false },
      { status: 503 }
    );
  }

  const type = searchParams.get('type') as ContentType | null;
  const contentId = Number(searchParams.get('contentId'));
  const courseId = Number(searchParams.get('courseId'));
  const projectId = Number(searchParams.get('projectId'));

  try {
    if (type && Number.isFinite(contentId) && contentId > 0) {
      const video = await getSingleVideo(type, contentId);
      if (!video) {
        return NextResponse.json(
          { error: 'Video no encontrado o el contenido no tiene video' },
          { status: 404 }
        );
      }
      return NextResponse.json(await buildStatus(video));
    }

    if (Number.isFinite(courseId) && courseId > 0) {
      const videos = await getCourseVideos(courseId);
      const statuses = await Promise.all(videos.map(buildStatus));
      return NextResponse.json({ courseId, ...summarize(statuses) });
    }

    if (Number.isFinite(projectId) && projectId > 0) {
      const videos = await getGuidedProjectVideos(projectId);
      const statuses = await Promise.all(videos.map(buildStatus));
      return NextResponse.json({ projectId, ...summarize(statuses) });
    }

    return NextResponse.json(
      { error: 'Se requiere (type + contentId), courseId o projectId' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[TRANSCRIPCIÓN] Error consultando estado:', error);
    return NextResponse.json(
      {
        error: 'Error consultando el estado',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
