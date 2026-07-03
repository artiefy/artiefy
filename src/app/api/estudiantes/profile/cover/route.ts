import { NextResponse } from 'next/server';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { auth } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';

const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5 MB

/** Derives the bucket region from the public S3 base URL (e.g. us-east-2). */
function getRegionFromS3Url(value: string): string | null {
  if (!value) return null;
  try {
    const host = new URL(value).hostname;
    const match = /\.?s3[.-]([a-z0-9-]+)\.amazonaws\.com$/i.exec(host);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

const PUBLIC_S3_BASE_URL = process.env.NEXT_PUBLIC_AWS_S3_URL ?? '';
// Use the BUCKET's region, not the generic AWS_REGION env (which may point at a
// different region and produce a 301 redirect that the browser reads as CORS).
const REGION = getRegionFromS3Url(PUBLIC_S3_BASE_URL) ?? 'us-east-2';
const BUCKET =
  process.env.AWS_BUCKET_NAME ?? process.env.AWS_S3_BUCKET ?? 'artiefy-upload';

function getClient(): S3Client {
  return new S3Client({
    region: REGION,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
}

/**
 * Uploads a profile cover image to S3 from the server (no browser -> S3 request,
 * so it does not depend on the bucket CORS config or region of AWS_REGION).
 * Returns the stored object key; persistence to the user row is done by the
 * caller via updateMyCover / updateMyProfile.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Archivo faltante' }, { status: 400 });
  }
  // Security best practice: only accept raster image types. SVG is rejected
  // because, if served inline, it can carry embedded scripts (stored XSS).
  const ALLOWED_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
  ]);
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'La portada debe ser una imagen (JPG, PNG, WEBP, GIF o AVIF).' },
      { status: 400 }
    );
  }
  if (file.size > MAX_COVER_SIZE) {
    return NextResponse.json(
      { error: 'La portada no puede superar los 5 MB.' },
      { status: 400 }
    );
  }

  const ext =
    (file.name.split('.').pop() ?? 'jpg')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'jpg';
  const key = `uploads/cover-${userId}-${Date.now()}-${uuidv4()}.${ext}`;
  const body = new Uint8Array(await file.arrayBuffer());

  try {
    await getClient().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: file.type,
      })
    );
  } catch {
    return NextResponse.json(
      { error: 'No se pudo subir la portada.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ key });
}
