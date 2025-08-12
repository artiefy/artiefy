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
