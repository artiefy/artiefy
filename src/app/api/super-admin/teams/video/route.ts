<<<<<<< HEAD
import { NextResponse } from 'next/server';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

import { db } from '~/server/db';
import { classMeetings } from '~/server/db/schema';

// 🚨 CONFIGURA TU BUCKET

interface ClassMeeting {
  id: number;
  courseId: number;
  meetingId: string;
  title: string;
  video_key: string | null;
  // ...otros campos si aplica
}

const s3 = new S3Client({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function getGraphToken() {
  const tenant = process.env.NEXT_PUBLIC_TENANT_ID!;
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET!;
  void tenant;

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
  interface TokenResponse {
    access_token: string;
    error?: string;
  }

  const data = (await res.json()) as TokenResponse;
  return data.access_token;
}

function decodeMeetingId(encodedId: string): string {
  try {
    const buffer = Buffer.from(encodedId, 'base64');
    const decoded = buffer.toString('utf8');
    const match = /19:meeting_[^@]+@thread\.v2/.exec(decoded);
    return match?.[0] ?? encodedId;
  } catch {
    return encodedId;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
  }

  const token = await getGraphToken();
  const url = `https://graph.microsoft.com/v1.0/users/${userId}/onlineMeetings/getAllRecordings(meetingOrganizerUserId='${userId}')`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  interface Recording {
    meetingId: string;
    recordingContentUrl?: string;
  }

  interface GetRecordingsResponse {
    value?: Recording[];
  }

  const data = (await response.json()) as GetRecordingsResponse;
  const recordings = data.value ?? [];

  const videos = [];

  for (const recording of recordings) {
    const decodedId = decodeMeetingId(recording.meetingId);
    const existing = await db
      .select()
      .from(classMeetings)
      .where(eq(classMeetings.meetingId, decodedId))
      .then((res: ClassMeeting[]) => res[0]);

    // Si ya hay un video_key en BD, devolverlo
    if (existing?.video_key) {
      videos.push({
        meetingId: decodedId,
        videoKey: existing.video_key,
        videoUrl: `https://s3.us-east-2.amazonaws.com/artiefy-upload/video_clase/${existing.video_key}`,
      });
      continue;
    }

    if (!recording.recordingContentUrl) continue;

    const videoRes = await fetch(recording.recordingContentUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!videoRes.ok) {
      console.error(`Error al descargar video: ${recording.meetingId}`);
      continue;
    }

    const buffer = await videoRes.arrayBuffer();
    const videoKey = `${uuidv4()}.mp4`;
    const nodeBuffer = Buffer.from(buffer); // 👈 transforma ArrayBuffer a Buffer

    const uploadCommand = new PutObjectCommand({
      Bucket: 'artiefy-upload',
      Key: `video_clase/${videoKey}`,
      Body: nodeBuffer, // ✅ ya es válido para AWS SDK
      ContentType: 'video/mp4',
    });

    await s3.send(uploadCommand);

    // ✅ Guardar video_key en BD
    if (!existing) {
      await db
        .update(classMeetings)
        .set({ video_key: videoKey })
        .where(eq(classMeetings.meetingId, decodedId));
    }

    videos.push({
      meetingId: decodedId,
      videoKey,
      videoUrl: `https://s3.us-east-2.amazonaws.com/artiefy-upload/video_clase/${videoKey}`,
    });
  }

  return NextResponse.json({ videos });
}
=======
// src/app/api/super-admin/teams/video/route.ts
import { NextResponse } from 'next/server';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

import { db } from '~/server/db';
import { classMeetings } from '~/server/db/schema';

// ---------------------- Helpers ----------------------

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

// ---------------------- Handler ----------------------

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

  // 2) Llamada a getAllRecordings
  const url = `https://graph.microsoft.com/v1.0/users/${userId}/onlineMeetings/getAllRecordings(meetingOrganizerUserId='${userId}')`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('📡 Graph status:', response.status);

  if (!response.ok) {
    const raw = await response.text().catch(() => '');
    console.error('❌ Error getAllRecordings:', raw);
    return NextResponse.json({ error: 'Graph error' }, { status: 500 });
  }

  const data = (await response.json()) as GetRecordingsResponse;
  const recordings = data.value ?? [];
  console.log('🎥 Grabaciones encontradas:', recordings.length);

  const videos: {
    meetingId: string;
    videoKey: string;
    videoUrl: string;
  }[] = [];

  // 3) Recorremos recordings
  for (const recording of recordings) {
    console.log('🔍 Procesando recording:', recording);

    // a) Obtener el meetingId real desde base64
    const decodedId = decodeMeetingId(recording.meetingId);

    // b) Buscar por meeting_id
    let existing = await db
      .select()
      .from(classMeetings)
      .where(eq(classMeetings.meetingId, decodedId))
      .limit(1)
      .then((r) => r[0] as ClassMeetingRow | undefined);

    // c) Si no está por meeting_id, intentar backfill buscando en join_url
    if (!existing) {
      // Trae todas las filas que tengan join_url (limit por seguridad)
      const candidates = (await db
        .select()
        .from(classMeetings)
        .where(sql`${classMeetings.joinUrl} IS NOT NULL`)
        .limit(500)) as unknown as ClassMeetingRow[];

      // Compara en Node (tipado estricto)
      const match = candidates.find((row) => {
        try {
          const decodedJoin = decodeURIComponent(row.joinUrl ?? '');
          return decodedJoin.includes(decodedId);
        } catch {
          return false;
        }
      });

      if (match) {
        // Backfill del meeting_id en la fila encontrada
        const updateMeetingId: Partial<typeof classMeetings.$inferInsert> = {
          meetingId: decodedId,
        };

        await db
          .update(classMeetings)
          .set(updateMeetingId)
          .where(eq(classMeetings.id, match.id));

        existing = { ...match, meetingId: decodedId };
        console.log(
          `🧩 Backfill meeting_id por join_url en class_meetings.id=${match.id}`
        );
      } else {
        console.warn(
          `⚠️ No encontré class_meetings para ${decodedId}. Omitiendo...`
        );
        continue; // no insertamos nuevas filas (courseId es NOT NULL)
      }
    }

    // d) Si ya tiene video_key, lo devolvemos
    if (existing.video_key) {
      console.log(`✅ Ya tenía video_key: ${existing.video_key}`);
      videos.push({
        meetingId: decodedId,
        videoKey: existing.video_key,
        videoUrl: `https://s3.us-east-2.amazonaws.com/artiefy-upload/video_clase/${existing.video_key}`,
      });
      continue;
    }

    // e) Descargar recording del Graph
    if (!recording.recordingContentUrl) {
      console.warn(`⚠️ recordingContentUrl vacío para ${decodedId}`);
      continue;
    }

    console.log(`⬇️ Descargando video para ${decodedId}...`);
    const videoRes = await fetch(recording.recordingContentUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!videoRes.ok) {
      console.error(`❌ Error descarga (${decodedId}):`, videoRes.status);
      continue;
    }

    // f) Subir a S3
    const buffer = await videoRes.arrayBuffer();
    const videoKey = `${uuidv4()}.mp4`;

    await s3.send(
      new PutObjectCommand({
        Bucket: 'artiefy-upload',
        Key: `video_clase/${videoKey}`,
        Body: Buffer.from(buffer),
        ContentType: 'video/mp4',
      })
    );
    console.log(`🚀 Subido a S3: ${videoKey}`);

    const updateVideoKey: Partial<typeof classMeetings.$inferInsert> = {
      video_key: videoKey,
    };

    await db
      .update(classMeetings)
      .set(updateVideoKey)
      .where(eq(classMeetings.id, existing.id));

    // h) Añadir a payload de respuesta
    videos.push({
      meetingId: decodedId,
      videoKey,
      videoUrl: `https://s3.us-east-2.amazonaws.com/artiefy-upload/video_clase/${videoKey}`,
    });
  }

  console.log('📤 Videos listos para enviar:', videos.length);
  return NextResponse.json({ videos });
}
>>>>>>> dev/miguel
