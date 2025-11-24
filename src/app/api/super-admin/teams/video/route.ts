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

interface VideoIdxItem {
  meetingId: string;
  videoKey: string;
  videoUrl: string;
  createdAt?: string;
  isSecondary?: boolean;
}
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
  video_key_2: string | null;
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

  const decodedIds = recordings
    .map((r) => decodeMeetingId(r.meetingId))
    .filter(Boolean);

  const uniqueIds = Array.from(new Set(decodedIds));

  console.log('🔍 IDs decodificados de grabaciones:', uniqueIds);

  // ✅ Ahora guardamos TODAS las filas por meetingId (no solo una)
  const rowsByMeetingId = new Map<string, ClassMeetingRow[]>();

  if (uniqueIds.length) {
    const rows = (await withDbRetry(() =>
      db
        .select()
        .from(classMeetings)
        .where(inArray(classMeetings.meetingId, uniqueIds))
    )) as unknown as ClassMeetingRow[];

    for (const r of rows) {
      if (!r.meetingId) continue;
      const k = r.meetingId;
      const arr = rowsByMeetingId.get(k) ?? [];
      arr.push(r);
      rowsByMeetingId.set(k, arr);
    }
  }


  const missingIds = uniqueIds.filter((id) => !rowsByMeetingId.has(id));
  console.log('⚠️ IDs sin match en BD:', missingIds);

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
      const matches = candidates.filter((row) => {
        try {
          const decodedJoin = decodeURIComponent(row.joinUrl ?? '');
          return decodedJoin.includes(mid);
        } catch {
          return false;
        }
      });

      if (matches.length) {
        // actualiza meetingId en BD para cada match (usualmente 1)
        for (const m of matches) {
          updates.push({ id: m.id, meetingId: mid });
        }
        // y refleja en el mapa local
        rowsByMeetingId.set(mid, matches.map((m) => ({ ...m, meetingId: mid })));
        console.log(
          `🧩 Backfill meeting_id por join_url para ${mid} en ids: ${matches
            .map((m) => m.id)
            .join(', ')}`
        );
      } else {
        console.warn(`⚠️ No encontré class_meetings para ${mid}. Omitiendo...`);
      }
    }

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

  const videos: VideoIdxItem[] = [];


  let uploadsStarted = 0;

  // 3) Recorremos recordings
  for (const recording of recordings) {
    try {
      // a) Obtener el meetingId real desde base64
      const decodedId = decodeMeetingId(recording.meetingId);

      // b) Obtener TODAS las filas que comparten el meetingId
      const rowsForMeeting = rowsByMeetingId.get(decodedId) ?? [];
      if (!rowsForMeeting.length) {
        console.warn(`⚠️ No encontré class_meetings para ${decodedId}. Omitiendo...`);
        continue;
      }

      // c) Si alguna ya tiene video_key, úsala y no “contamines” otras
      const withKey = rowsForMeeting.find((r) => r.video_key);
      if (withKey?.video_key) {
        console.log(`✅ Ya tenía video_key (id=${withKey.id}): ${withKey.video_key}`);
        videos.push({
          meetingId: decodedId,
          videoKey: withKey.video_key,
          videoUrl: `https://s3.us-east-2.amazonaws.com/artiefy-upload/video_clase/${withKey.video_key}`,
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

        let targetRow = rowsForMeeting[0];
        const recISO = recording.createdDateTime ?? null;

        if (recISO) {
          const recTime = new Date(recISO).getTime();
          targetRow = rowsForMeeting.reduce((best, row) => {
            const t = row.startDateTime ? new Date(row.startDateTime).getTime() : Infinity;
            const bt = best.startDateTime ? new Date(best.startDateTime).getTime() : Infinity;
            return Math.abs(t - recTime) < Math.abs(bt - recTime) ? row : best;
          }, rowsForMeeting[0]);
        }

        // h.1) Determinar en qué campo guardar (video_key o video_key_2)
        try {
          const existingRow = rowsForMeeting.find(r => r.id === targetRow.id);
          const updatePayload = existingRow?.video_key
            ? { video_key_2: videoKey }
            : { video_key: videoKey };

          await withDbRetry(() =>
            db
              .update(classMeetings)
              .set(updatePayload)
              .where(eq(classMeetings.id, targetRow.id))
          );

          const fieldUsed = existingRow?.video_key ? 'video_key_2' : 'video_key';
          console.log(`✅ ${fieldUsed} asignado a class_meetings.id=${targetRow.id}`);
        } catch (err: unknown) {
          console.error(
            `❌ Error guardando video_key en BD (${decodedId}):`,
            errMsg(err)
          );
          continue;
        }

        // h.2) Refrescar el mapa en memoria
        const refreshed = rowsForMeeting.map((r) =>
          r.id === targetRow.id
            ? { ...r, video_key: r.video_key ?? videoKey, video_key_2: r.video_key ? videoKey : r.video_key_2 }
            : r
        );
        rowsByMeetingId.set(decodedId, refreshed);



        // i) Añadir a payload
        videos.push({
          meetingId: decodedId,
          videoKey,
          videoUrl: `https://s3.us-east-2.amazonaws.com/artiefy-upload/video_clase/${videoKey}`,
          createdAt: recording.createdDateTime,
        });
        if (targetRow.video_key) {
          videos.push({
            meetingId: decodedId,
            videoKey: videoKey,
            videoUrl: `https://s3.us-east-2.amazonaws.com/artiefy-upload/video_clase/${videoKey}`,
            createdAt: recording.createdDateTime,
            isSecondary: true,
          });
        }

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

  const latestByMeetingId = new Map<string, typeof videos[number]>();
  for (const v of videos) {
    const key = v.meetingId;
    const prev = latestByMeetingId.get(key);
    if (!prev) {
      latestByMeetingId.set(key, v);
    } else {
      const prevT = prev.createdAt ? new Date(prev.createdAt).getTime() : 0;
      const curT = v.createdAt ? new Date(v.createdAt).getTime() : 0;
      if (curT >= prevT) latestByMeetingId.set(key, v);
    }
  }

  const payload = Array.from(latestByMeetingId.values());
  console.log('📤 Videos listos para enviar (dedup):', payload.length);
  return NextResponse.json({ videos: payload });
}



