/**
 * Transcripción de videos usando el servicio propio de Whisper en el VPS
 * (ver `docker/transcriptions/`).
 *
 * El flujo es asíncrono: se encola un job en el VPS (responde al instante) y
 * luego se reconcilia el resultado, ya sea desde el cron o cuando la UI
 * consulta el estado. Nada bloquea la petición del usuario.
 *
 * Las transcripciones se guardan en Redis. Para las clases se conserva la key
 * heredada `transcription:lesson:{id}` con el mismo formato
 * `[{ start, end, text }]`, para no romper `/api/lessons/getTranscription`
 * ni la vista de estudiantes.
 */

import { Redis } from '@upstash/redis';

import { env } from '~/env';

/** Un segmento de transcripción, con tiempos en segundos. */
export interface TranscriptionItem {
  start: number;
  end: number;
  text: string;
}

/** Tipos de contenido de Artiefy que tienen video transcribible. */
export type ContentType =
  | 'lesson' // clases
  | 'meeting' // grabaciones de Teams
  | 'project' // proyectos guiados
  | 'objective' // objetivos de un proyecto guiado
  | 'activity'; // actividades de un objetivo

export type TranscriptionStatus = 'processing' | 'completed' | 'failed';

export interface TranscriptionState {
  status: TranscriptionStatus;
  jobId: string;
  type: ContentType;
  contentId: number;
  startedAt: string;
  updatedAt: string;
  error?: string;
}

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Key de la transcripción final.
 *
 * Para `lesson` produce exactamente `transcription:lesson:{id}`, que es la key
 * histórica: por eso el resto de la app sigue funcionando sin cambios.
 */
export const transcriptionKey = (type: ContentType, id: number | string) =>
  `transcription:${type}:${id}`;

/** Key con el estado del job. */
export const statusKey = (type: ContentType, id: number | string) =>
  `transcription:status:${type}:${id}`;

/** Set con los jobs en curso, para que el cron sepa qué reconciliar. */
export const PENDING_SET = 'transcription:pending';

/** Miembro del set de pendientes: identifica tipo + id en un solo string. */
const pendingMember = (type: ContentType, id: number) => `${type}:${id}`;

function parsePendingMember(
  member: string
): { type: ContentType; contentId: number } | null {
  const [type, rawId] = member.split(':');
  const contentId = Number(rawId);
  if (!type || !Number.isFinite(contentId)) return null;
  return { type: type as ContentType, contentId };
}

/** El jobId que se le manda al VPS. Es estable, lo que lo hace idempotente. */
const buildJobId = (type: ContentType, id: number) => `${type}-${id}`;

/* ------------------------------------------------------------------ */
/* Cliente HTTP del servicio de transcripción                          */
/* ------------------------------------------------------------------ */

interface VpsJobResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  segments?: TranscriptionItem[];
  error?: string;
}

class TranscriptionServiceNotConfigured extends Error {
  constructor() {
    super(
      'El servicio de transcripción no está configurado. Falta TRANSCRIBE_API_URL o TRANSCRIBE_API_KEY.'
    );
    this.name = 'TranscriptionServiceNotConfigured';
  }
}

function serviceConfig(): { baseUrl: string; apiKey: string } {
  const baseUrl = env.TRANSCRIBE_API_URL;
  const apiKey = env.TRANSCRIBE_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new TranscriptionServiceNotConfigured();
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey };
}

/** true si el VPS está configurado. La UI lo usa para no ofrecer el botón. */
export function isTranscriptionServiceConfigured(): boolean {
  return Boolean(env.TRANSCRIBE_API_URL && env.TRANSCRIBE_API_KEY);
}

async function vpsRequest<T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const { baseUrl, apiKey } = serviceConfig();
  const { timeoutMs = 20_000, ...rest } = init ?? {};

  const response = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      ...(rest.headers ?? {}),
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `El servicio de transcripción respondió ${response.status}${
        body ? `: ${body.slice(0, 300)}` : ''
      }`
    );
  }

  return (await response.json()) as T;
}

/* ------------------------------------------------------------------ */
/* Resolución de URLs de video                                         */
/* ------------------------------------------------------------------ */

const S3_BASE = (process.env.NEXT_PUBLIC_AWS_S3_URL ?? '').replace(/\/+$/, '');

/**
 * Arma la URL pública del video a partir de la key guardada en la base.
 *
 * Las grabaciones de Teams viven bajo `video_clase/`, el resto cuelga
 * directamente de la raíz del bucket. Si ya viene una URL completa (caso de
 * `videoUrlExt`), se respeta tal cual.
 */
export function buildVideoUrl(type: ContentType, key: string): string {
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  const prefix = type === 'meeting' ? 'video_clase/' : '';
  return `${S3_BASE}/${prefix}${key}`;
}

/* ------------------------------------------------------------------ */
/* API pública                                                         */
/* ------------------------------------------------------------------ */

/**
 * Encola la transcripción de un video.
 *
 * Devuelve `null` si ya hay un job en curso para ese contenido, para no
 * duplicar trabajo en el VPS.
 */
export async function startTranscription(
  type: ContentType,
  contentId: number,
  videoKey: string
): Promise<{ jobId: string } | null> {
  const existing = await redis.get<TranscriptionState>(
    statusKey(type, contentId)
  );
  if (existing?.status === 'processing') {
    return null;
  }

  const jobId = buildJobId(type, contentId);
  const url = buildVideoUrl(type, videoKey);

  await vpsRequest<VpsJobResponse>('/jobs', {
    method: 'POST',
    body: JSON.stringify({ url, jobId }),
  });

  const now = new Date().toISOString();
  const state: TranscriptionState = {
    status: 'processing',
    jobId,
    type,
    contentId,
    startedAt: now,
    updatedAt: now,
  };

  await redis.set(statusKey(type, contentId), state);
  await redis.sadd(PENDING_SET, pendingMember(type, contentId));

  return { jobId };
}

/**
 * Consulta el job en el VPS y, si ya terminó, guarda la transcripción en
 * Redis. Idempotente: sobre un job ya cerrado no hace nada.
 */
export async function reconcileTranscription(
  type: ContentType,
  contentId: number
): Promise<TranscriptionState | null> {
  const state = await redis.get<TranscriptionState>(statusKey(type, contentId));
  if (!state) return null;
  if (state.status !== 'processing') return state;

  let job: VpsJobResponse;
  try {
    job = await vpsRequest<VpsJobResponse>(
      `/jobs/${encodeURIComponent(state.jobId)}`
    );
  } catch (error) {
    // Un 404 significa que el job se perdió (se borró el volumen o se reinició
    // el VPS sin persistencia): se marca fallido para poder reintentar.
    return finishWithError(
      state,
      error instanceof Error ? error.message : 'Error consultando el job'
    );
  }

  if (job.status === 'failed') {
    return finishWithError(state, job.error ?? 'El VPS reportó failed');
  }

  if (job.status !== 'completed') {
    return state; // queued / processing
  }

  const segments = job.segments ?? [];
  await redis.set(transcriptionKey(type, contentId), segments);

  const completed: TranscriptionState = {
    ...state,
    status: 'completed',
    updatedAt: new Date().toISOString(),
  };
  await redis.set(statusKey(type, contentId), completed);
  await redis.srem(PENDING_SET, pendingMember(type, contentId));

  return completed;
}

async function finishWithError(
  state: TranscriptionState,
  error: string
): Promise<TranscriptionState> {
  const failed: TranscriptionState = {
    ...state,
    status: 'failed',
    error,
    updatedAt: new Date().toISOString(),
  };
  await redis.set(statusKey(state.type, state.contentId), failed);
  await redis.srem(PENDING_SET, pendingMember(state.type, state.contentId));
  return failed;
}

/** Reconcilia todos los jobs pendientes. Lo usa el cron. */
export async function reconcileAllPending(): Promise<{
  checked: number;
  completed: number;
  failed: number;
  stillProcessing: number;
}> {
  const pending = await redis.smembers(PENDING_SET);

  let completed = 0;
  let failed = 0;
  let stillProcessing = 0;

  for (const member of pending) {
    const parsed = parsePendingMember(member);
    if (!parsed) {
      await redis.srem(PENDING_SET, member);
      continue;
    }

    const state = await reconcileTranscription(parsed.type, parsed.contentId);
    if (state?.status === 'completed') completed++;
    else if (state?.status === 'failed') failed++;
    else stillProcessing++;
  }

  return { checked: pending.length, completed, failed, stillProcessing };
}

/** Estado guardado, sin consultar al VPS. */
export async function getTranscriptionState(
  type: ContentType,
  contentId: number
): Promise<TranscriptionState | null> {
  return redis.get<TranscriptionState>(statusKey(type, contentId));
}

/** true si ese contenido ya tiene transcripción guardada. */
export async function hasTranscription(
  type: ContentType,
  contentId: number
): Promise<boolean> {
  const existing = await redis.get(transcriptionKey(type, contentId));
  return existing !== null && existing !== undefined;
}

/** Salud del servicio, para diagnosticar desde el panel. */
export async function checkServiceHealth(): Promise<{
  configured: boolean;
  reachable: boolean;
  detail?: unknown;
  error?: string;
}> {
  if (!isTranscriptionServiceConfigured()) {
    return { configured: false, reachable: false };
  }
  try {
    const health = await vpsRequest<unknown>('/health', { timeoutMs: 8000 });
    return { configured: true, reachable: true, detail: health };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
