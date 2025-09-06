// src/app/api/super-admin/teams/video/route.ts
import { NextResponse } from 'next/server';

import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { eq, inArray, sql as dsql } from 'drizzle-orm';
import { Readable } from 'node:stream';
import { v4 as uuidv4 } from 'uuid';

import { db } from '~/server/db';
import { classMeetings } from '~/server/db/schema';

import type { ReadableStream as NodeWebReadableStream } from 'node:stream/web';

// Para asegurarte de que estás en runtime Node (streams grandes)
export const runtime = 'nodejs';

// ---------------------- Helpers (puedes reutilizar los tuyos) ----------------------

function decodeMeetingId(encodedId: string): string {
  try {
    const decoded = Buffer.from(encodedId, 'base64').toString('utf8');
    const match = /19:meeting_[^@]+@thread\.v2/.exec(decoded);
    return match?.[0] ?? encodedId;
  } catch {
    return encodedId;
  }
}

async function getGraphToken() {
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET!;

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('scope', 'https://graph.microsoft.com/.default');

  const res = await fetch(
    'https://login.microsoftonline.com/060f4acf-9732-441b-80f7-425de7381dd1/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    }
  );

  const data = (await res.json()) as { access_token?: string };
  return data.access_token;
}

const s3 = new S3Client({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ---------------------- Tipos ----------------------

interface GraphRecording {
  meetingId: string;
  recordingContentUrl?: string;
  createdDateTime?: string;
}

interface GetRecordingsResponse {
  value?: GraphRecording[];
}

interface ClassMeetingRow {
  id: number;
  courseId: number;
  title: string;
  startDateTime: Date | null;
  endDateTime: Date | null;
  weekNumber: number | null;
  createdAt: Date | null;
  joinUrl: string | null;
  meetingId: string | null;
  video_key: string | null;
}

function errMsg(e: unknown): string {
  if (e instanceof Error && typeof e.message === 'string') return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

async function withDbRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e: unknown) {
      const msg = errMsg(e);
      const transient =
        msg.includes('fetch failed') ||
        msg.includes('ECONNRESET') ||
        msg.includes('ETIMEDOUT') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('503') ||
        msg.includes('502');

      lastErr = e;
      if (!transient || i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 200 * Math.pow(2, i))); // backoff: 200,400,800,1600
    }
  }
  throw lastErr;
}

// ---------------------- GET ----------------------

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  console.log('📥 GET /api/super-admin/teams/video - Params:', { userId });

  if (!userId) {
    return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
  }

  // 1) Token MS Graph
  const token = await getGraphToken();
  if (!token) {
    console.error('❌ No pude obtener token de Graph');
    return NextResponse.json({ error: 'Auth Graph' }, { status: 500 });
  }

  // 2) Llamada a getAllRecordings (con timeout)
  const url = `https://graph.microsoft.com/v1.0/users/${userId}/onlineMeetings/getAllRecordings(meetingOrganizerUserId='${userId}')`;
  const listRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20_000),
  });

  console.log('📡 Graph status:', listRes.status);

  if (!listRes.ok) {
    const raw = await listRes.text().catch(() => '');
    console.error('❌ Error getAllRecordings:', raw);
    return NextResponse.json({ error: 'Graph error' }, { status: 500 });
  }

  const data = (await listRes.json()) as GetRecordingsResponse;
  const recordings = data.value ?? [];
  console.log('🎥 Grabaciones encontradas:', recordings.length);

  // ---- PRE-CARGA EN BATCH DE CLASS_MEETINGS ----
  const decodedIds = recordings
    .map((r) => decodeMeetingId(r.meetingId))
    .filter(Boolean);

  const uniqueIds = Array.from(new Set(decodedIds));

  const existingByMeetingId = new Map<string, ClassMeetingRow>();

  // a) Trae de una sola vez los que ya tienen meeting_id
  if (uniqueIds.length) {
    const rows = (await withDbRetry(() =>
      db
        .select()
        .from(classMeetings)
        .where(inArray(classMeetings.meetingId, uniqueIds))
    )) as unknown as ClassMeetingRow[];
    rows.forEach((r) => {
      if (r.meetingId) existingByMeetingId.set(r.meetingId, r);
    });
  }

  // b) Para IDs que faltan, intenta un backfill ÚNICO basado en join_url
  const missingIds = uniqueIds.filter((id) => !existingByMeetingId.has(id));
  if (missingIds.length) {
    const candidates = (await withDbRetry(() =>
      db
        .select()
        .from(classMeetings)
        .where(dsql`${classMeetings.joinUrl} IS NOT NULL`)
        .limit(1000)
    )) as unknown as ClassMeetingRow[];

    const updates: { id: number; meetingId: string }[] = [];

    for (const mid of missingIds) {
      const match = candidates.find((row) => {
        try {
          const decodedJoin = decodeURIComponent(row.joinUrl ?? '');
          return decodedJoin.includes(mid);
        } catch {
          return false;
        }
      });

      if (match) {
        updates.push({ id: match.id, meetingId: mid });
        existingByMeetingId.set(mid, { ...match, meetingId: mid });
        console.log(
          `🧩 Backfill meeting_id por join_url en class_meetings.id=${match.id}`
        );
      } else {
        console.warn(`⚠️ No encontré class_meetings para ${mid}. Omitiendo...`);
      }
    }

    // Persiste los backfills (uno por uno con retry; o podrías chunkear)
    for (const u of updates) {
      await withDbRetry(() =>
        db
          .update(classMeetings)
          .set({ meetingId: u.meetingId })
          .where(eq(classMeetings.id, u.id))
      );
    }
  }

  // Para no bloquear el request por mucho tiempo
  const MAX_NEW_UPLOADS = 2; // súbelo si quieres, pero no lo dejes infinito
  const PER_DOWNLOAD_TIMEOUT_MS = 90_000; // 90s por grabación

  const videos: {
    meetingId: string;
    videoKey: string;
    videoUrl: string;
    createdAt?: string;
  }[] = [];

  let uploadsStarted = 0;

  // 3) Recorremos recordings
  // 3) Recorremos recordings
  for (const recording of recordings) {
    try {
      // a) Obtener el meetingId real desde base64
      const decodedId = decodeMeetingId(recording.meetingId);

      // b) Usar el mapa precargado (SIN hacer query aquí)
      const existing = existingByMeetingId.get(decodedId);
      if (!existing) {
        console.warn(
          `⚠️ No encontré class_meetings para ${decodedId}. Omitiendo...`
        );
        continue;
      }

      // c) Si ya tiene video_key, lo devolvemos
      if (existing.video_key) {
        console.log(`✅ Ya tenía video_key: ${existing.video_key}`);
        videos.push({
          meetingId: decodedId,
          videoKey: existing.video_key,
          videoUrl: `https://s3.us-east-2.amazonaws.com/artiefy-upload/video_clase/${existing.video_key}`,
          createdAt: recording.createdDateTime,
        });
        continue;
      }

      // d) Control de subidas nuevas por request
      if (uploadsStarted >= MAX_NEW_UPLOADS) {
        console.log('⏭️ Límite de subidas nuevas alcanzado para este request');
        continue;
      }

      // e) Validar URL de descarga
      if (!recording.recordingContentUrl) {
        console.warn(`⚠️ recordingContentUrl vacío para ${decodedId}`);
        continue;
      }

      // f) Descargar por streaming con timeout (si falla, seguimos)
      console.log(`⬇️ Descargando video para ${decodedId}...`);
      const dlController = new AbortController();
      const dlTimeout = setTimeout(
        () => dlController.abort(),
        PER_DOWNLOAD_TIMEOUT_MS
      );

      let videoRes: Response;
      try {
        videoRes = await fetch(recording.recordingContentUrl, {
          headers: { Authorization: `Bearer ${token}` },
          signal: dlController.signal,
        });
      } catch (err: unknown) {
        console.error(`❌ Error inicio descarga (${decodedId}):`, errMsg(err));
        clearTimeout(dlTimeout);
        continue;
      }

      clearTimeout(dlTimeout);

      if (!videoRes.ok || !videoRes.body) {
        console.error(`❌ Error descarga (${decodedId}):`, videoRes.status);
        continue;
      }

      // g) Subir a S3 por streaming con Upload (evita headers inválidos)
      const videoKey = `${uuidv4()}.mp4`;
      try {
        // 1) Convertir a Node Readable
        const webStream =
          videoRes.body as unknown as NodeWebReadableStream<Uint8Array>;
        const nodeStream = Readable.fromWeb(webStream);

        // 2) Metadata segura (sin undefined)
        const contentType = videoRes.headers.get('content-type') ?? 'video/mp4';
        const contentLengthHeader = videoRes.headers.get('content-length');
        const contentLength =
          contentLengthHeader && !Number.isNaN(Number(contentLengthHeader))
            ? Number(contentLengthHeader)
            : undefined;

        // 3) Subir con Upload (multipart/chunked)
        const uploader = new Upload({
          client: s3,
          params: {
            Bucket: 'artiefy-upload',
            Key: `video_clase/${videoKey}`,
            Body: nodeStream,
            ContentType: contentType,
            ...(contentLength !== undefined
              ? { ContentLength: contentLength }
              : {}),
          },
          queueSize: 3,
          partSize: 10 * 1024 * 1024, // 10MB
          leavePartsOnError: false,
        });

        await uploader.done();
        console.log(`🚀 Subido a S3: ${videoKey}`);

        // h) Guardar en BD el video_key (con retry)
        try {
          await withDbRetry(() =>
            db
              .update(classMeetings)
              .set({ video_key: videoKey })
              .where(eq(classMeetings.id, existing.id))
          );
        } catch (err: unknown) {
          console.error(
            `❌ Error guardando video_key en BD (${decodedId}):`,
            errMsg(err)
          );
          continue;
        }

        // refresca cache en memoria para este request
        existing.video_key = videoKey;
        existingByMeetingId.set(decodedId, { ...existing });

        // i) Añadir a payload
        videos.push({
          meetingId: decodedId,
          videoKey,
          videoUrl: `https://s3.us-east-2.amazonaws.com/artiefy-upload/video_clase/${videoKey}`,
          createdAt: recording.createdDateTime,
        });

        uploadsStarted += 1;
      } catch (err: unknown) {
        console.error(`❌ Error subiendo a S3 (${decodedId}):`, errMsg(err));
        continue;
      }
    } catch (err: unknown) {
      console.error(
        '❌ Error inesperado en iteración de recording:',
        errMsg(err)
      );
      continue;
    }
  }

  console.log('📤 Videos listos para enviar:', videos.length);
  return NextResponse.json({ videos });
}
