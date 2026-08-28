import { NextResponse } from 'next/server';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

import { getApiSession } from '~/server/utils/apiAuth';

// Server-side image upload for the community-post composer. The browser
// used to POST directly to a presigned S3 URL (`/api/upload`'s
// `createPresignedPost` flow), but that request is cross-origin and fails
// with a bare `TypeError: Failed to fetch` whenever the bucket's CORS
// policy doesn't allow it — pre-existing infrastructure config that this
// route sidesteps entirely by doing the S3 write from the server instead
// (same pattern as `documentupload-direct` and
// `src/app/api/estudiantes/profile/cover/route.ts`).

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8 MB

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

function getS3Config() {
  const bucket = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new Error('Faltan variables de entorno de AWS');
  }

  return {
    bucket,
    client: new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

// Same key convention `/api/upload` uses: `uploads/<sanitized>-<unique>.<ext>`.
function sanitizeFileName(fileName: string): string {
  const base = fileName
    .split('.')
    .slice(0, -1)
    .join('.')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return base || 'imagen';
}

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Falta el archivo de imagen' },
      { status: 400 }
    );
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Solo se permiten imágenes (JPG, PNG, WEBP, GIF o AVIF)' },
      { status: 400 }
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: 'La imagen no puede superar los 8 MB' },
      { status: 400 }
    );
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const sanitizedBase = sanitizeFileName(file.name);
  const key = `uploads/${sanitizedBase}-${Date.now()}-${uuidv4()}.${extension}`;

  try {
    const { bucket, client } = getS3Config();
    const body = new Uint8Array(await file.arrayBuffer());

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: file.type,
        ACL: 'public-read',
      })
    );
  } catch (error) {
    console.error('[community-posts/upload-image] error', error);
    return NextResponse.json(
      { error: 'No se pudo subir la imagen. Inténtalo de nuevo.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ key }, { status: 201 });
}
