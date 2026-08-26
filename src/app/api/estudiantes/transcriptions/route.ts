/**
 * GET /api/estudiantes/transcriptions?type=activity&contentId=7
 *
 * Lectura de transcripciones para la vista de estudiantes. Devuelve los
 * segmentos en JSON, a diferencia de `/api/super-admin/transcriptions/download`,
 * que exige rol admin y entrega un `.txt` para descargar.
 *
 * Solo lee de Redis: nunca encola una transcripción en el VPS.
 */

import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';

import { env } from '~/env';
import {
  type ContentType,
  type TranscriptionItem,
  transcriptionKey,
} from '~/lib/transcriptions/whisper-vps';

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

const VALID_TYPES: ContentType[] = [
  'lesson',
  'meeting',
  'project',
  'objective',
  'activity',
];

/** Redis puede devolver el arreglo ya parseado o el JSON todavía en texto. */
function parseTranscription(value: TranscriptionItem[] | string) {
  if (Array.isArray(value)) return value;

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as TranscriptionItem[]) : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = (searchParams.get('type') ?? 'lesson') as ContentType;
  const contentId = Number(searchParams.get('contentId'));

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'type inválido' }, { status: 400 });
  }
  if (!Number.isFinite(contentId) || contentId <= 0) {
    return NextResponse.json({ error: 'contentId inválido' }, { status: 400 });
  }

  const stored = await redis.get<TranscriptionItem[] | string>(
    transcriptionKey(type, contentId)
  );

  // Sin transcripción no es un error para la UI: la pestaña simplemente no se
  // muestra, así que se responde 200 con una lista vacía.
  return NextResponse.json({
    transcription: stored ? parseTranscription(stored) : [],
  });
}
