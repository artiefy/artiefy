import { NextResponse } from 'next/server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Security best practice: never trust an identity supplied by the client.
// The submission owner is taken from the authenticated session, and the upload
// is bounded by type/size to prevent storage/cost abuse against Redis.
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const BLOCKED_EXTENSIONS = new Set([
  'exe',
  'sh',
  'bat',
  'cmd',
  'com',
  'msi',
  'js',
  'jar',
  'php',
  'html',
  'htm',
  'svg',
]);

export async function POST(request: Request) {
  try {
    // Derive the identity from the session, not from the request body.
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const activityId = formData.get('activityId') as string;
    const questionId = formData.get('questionId') as string;

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }
    if (!activityId || !questionId) {
      return NextResponse.json(
        { error: 'activityId y questionId son requeridos' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'El archivo no puede superar los 10 MB.' },
        { status: 400 }
      );
    }

    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    if (BLOCKED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido.' },
        { status: 400 }
      );
    }

    const user = await currentUser();
    const userName =
      [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
      user?.username ||
      userId;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileContent = buffer.toString('base64');

    const key = `activity:${activityId}:${questionId}:${userId}:${Date.now()}`;
    await redis.hset(key, {
      fileContent,
      fileName: file.name,
      submittedAt: new Date().toISOString(),
      userId,
      userName,
      status: 'pendiente',
    });

    const activityIndex = `activity:${activityId}:submissions`;
    await redis.sadd(activityIndex, key);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Error al subir el archivo' },
      { status: 500 }
    );
  }
}
