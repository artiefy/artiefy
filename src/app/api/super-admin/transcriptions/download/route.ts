/**
 * GET /api/super-admin/transcriptions/download?type=lesson&contentId=123
 *
 * Descarga la transcripción como .txt. Solo lee de Redis: nunca dispara una
 * transcripción (para eso está `/start`), así un click accidental no encola
 * trabajo en el VPS.
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

function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export async function GET(request: Request) {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;
  if (!userId || (role !== 'admin' && role !== 'super-admin')) {
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

  const transcription = await redis.get<TranscriptionItem[] | string>(
    transcriptionKey(type, contentId)
  );

  if (!transcription) {
    return NextResponse.json(
      { error: 'Todavía no hay transcripción para este contenido' },
      { status: 404 }
    );
  }

  const text = Array.isArray(transcription)
    ? transcription
        .map(
          (item) =>
            `${formatTime(item.start)} - ${item.text} - ${formatTime(item.end)}`
        )
        .join('\n')
    : String(transcription);

  return new NextResponse(text, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="transcripcion-${type}-${contentId}.txt"`,
    },
  });
}
