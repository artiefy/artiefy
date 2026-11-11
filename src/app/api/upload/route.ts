import { NextResponse } from 'next/server';

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

import { authorizeStaff, getApiSession } from '~/server/utils/apiAuth';

const MAX_SIMPLE_UPLOAD_SIZE = 500 * 1024 * 1024; // 500 MB
const MAX_PUT_UPLOAD_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB (limite PUT en S3)
const MAX_VIDEO_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB
const MAX_FILE_SIZE = 25 * 1024 * 1024 * 1024; // 25 GB
const MULTIPART_PART_SIZE = 100 * 1024 * 1024; // 100 MB

// Security best practice: the stored Content-Type is the declared one
// (public-read objects), so only the types the upload screens actually send
// are accepted: raster images, videos and PDF/Office documents.
const IMAGE_TYPES: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/heic',
  'image/heif',
  'image/tiff',
]);
// SVG can carry scripts, so only staff (academy logos, course media) may
// upload it; students never need it.
const STAFF_ONLY_IMAGE_TYPES: ReadonlySet<string> = new Set([
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);
const VIDEO_TYPES: ReadonlySet<string> = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
  'video/mpeg',
  'video/x-matroska',
  'video/x-msvideo',
  'video/avi',
  'video/x-ms-wmv',
  'video/x-flv',
  'video/x-m4v',
  'video/3gpp',
  'video/3gpp2',
  'video/mp2t',
]);
const DOCUMENT_TYPES: ReadonlySet<string> = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

// Every key this route issues lives under this prefix.
const UPLOAD_KEY_PREFIX = 'uploads/';

function getS3Config() {
  const requiredEnv = {
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  };

  const missingEnv = Object.entries(requiredEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingEnv.length > 0) {
    throw new Error(`Faltan variables AWS: ${missingEnv.join(', ')}`);
  }

  return {
    bucket: requiredEnv.AWS_BUCKET_NAME!,
    client: new S3Client({
      region: requiredEnv.AWS_REGION!,
      credentials: {
        accessKeyId: requiredEnv.AWS_ACCESS_KEY_ID!,
        secretAccessKey: requiredEnv.AWS_SECRET_ACCESS_KEY!,
      },
    }),
  };
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function isAllowedContentType(contentType: string, isStaff: boolean) {
  return (
    IMAGE_TYPES.has(contentType) ||
    VIDEO_TYPES.has(contentType) ||
    DOCUMENT_TYPES.has(contentType) ||
    (isStaff && STAFF_ONLY_IMAGE_TYPES.has(contentType))
  );
}

/** A key issued by this route: `uploads/...`, no path traversal. */
function isManagedKey(key: unknown): key is string {
  return (
    typeof key === 'string' &&
    key.startsWith(UPLOAD_KEY_PREFIX) &&
    key.length > UPLOAD_KEY_PREFIX.length &&
    key.length <= 1024 &&
    !key.includes('..')
  );
}

function getSafeExtension(fileName: string): string {
  const parts = fileName.split('.');
  const extension = parts.length > 1 ? (parts.pop() ?? '') : '';
  const clean = extension
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10);
  return clean || 'bin';
}

/**
 * Unique key base derived from the client file name. The client value never
 * becomes the key: directories are dropped and only [a-z0-9-] is kept, then
 * a timestamp and a UUID are appended (`<name>-<timestamp>-<uuid>`).
 */
function buildKeyBase(fileName: string): string {
  const name = fileName.split(/[\\/]/).pop() ?? '';
  const baseName = name
    .split('.')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

  return `${baseName}-${Date.now()}-${uuidv4()}`;
}

export async function POST(request: Request) {
  try {
    // Security best practice: `/api` is not covered by the Clerk middleware,
    // so uploads require a signed-in user here.
    const session = await getApiSession();
    if (!session.userId) return jsonError('No autorizado', 401);

    const { bucket, client } = getS3Config();
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError('El cuerpo de la solicitud no es un JSON válido', 400);
    }

    const {
      action,
      contentType,
      fileSize,
      fileName,
      key,
      uploadId,
      partNumber,
      parts,
    } = body as {
      action?: 'multipart-part' | 'multipart-complete' | 'multipart-abort';
      contentType?: string;
      fileSize?: number;
      fileName?: string;
      key?: string;
      uploadId?: string;
      partNumber?: number;
      parts?: Array<{ ETag: string; PartNumber: number }>;
    };

    if (
      action === 'multipart-part' ||
      action === 'multipart-complete' ||
      action === 'multipart-abort'
    ) {
      // Multipart uploads are only issued for files above the student size
      // limit, so only staff ever continue one.
      if (!session.isStaff) return jsonError('Acceso denegado', 403);
      if (key !== undefined && !isManagedKey(key)) {
        return jsonError('Key no válida', 400);
      }
    }

    if (action === 'multipart-part') {
      if (!key || !uploadId || !partNumber) {
        return NextResponse.json(
          { error: 'Se requieren key, uploadId y partNumber' },
          { status: 400 }
        );
      }

      const command = new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });

      const signedUrl = await getSignedUrl(client, command, {
        expiresIn: 3600,
      });

      return NextResponse.json({
        url: signedUrl,
      });
    }

    if (action === 'multipart-complete') {
      if (!key || !uploadId || !parts?.length) {
        return NextResponse.json(
          { error: 'Se requieren key, uploadId y parts' },
          { status: 400 }
        );
      }

      await client.send(
        new CompleteMultipartUploadCommand({
          Bucket: bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: parts,
          },
        })
      );

      return NextResponse.json({
        key,
        uploadId,
        status: 'completed',
      });
    }

    if (action === 'multipart-abort') {
      if (!key || !uploadId) {
        return NextResponse.json(
          { error: 'Se requieren key y uploadId' },
          { status: 400 }
        );
      }

      await client.send(
        new AbortMultipartUploadCommand({
          Bucket: bucket,
          Key: key,
          UploadId: uploadId,
        })
      );

      return NextResponse.json({
        key,
        uploadId,
        status: 'aborted',
      });
    }

    if (!contentType || !fileSize || !fileName) {
      return NextResponse.json(
        { error: 'Se requieren contentType, fileSize y fileName' },
        { status: 400 }
      );
    }

    if (
      typeof contentType !== 'string' ||
      typeof fileName !== 'string' ||
      typeof fileSize !== 'number' ||
      !Number.isFinite(fileSize) ||
      fileSize <= 0
    ) {
      return jsonError('Datos de archivo no válidos', 400);
    }

    if (!isAllowedContentType(contentType, session.isStaff)) {
      return jsonError('Tipo de archivo no permitido', 400);
    }

    const isVideo = VIDEO_TYPES.has(contentType);

    if (isVideo && fileSize > MAX_VIDEO_SIZE) {
      return jsonError('Video demasiado grande (> 10GB)', 400);
    }

    if (!isVideo && fileSize > MAX_FILE_SIZE) {
      return jsonError('Archivo demasiado grande (> 25GB)', 400);
    }

    // Students only upload through the simple presigned POST flow.
    if (!session.isStaff && fileSize > MAX_SIMPLE_UPLOAD_SIZE) {
      return jsonError('Archivo demasiado grande (> 500MB)', 400);
    }

    // The S3 key is always generated here; the client `fileName` only
    // contributes a sanitized base name and the extension.
    const sanitizedBase = buildKeyBase(fileName);
    const extension = getSafeExtension(fileName);
    const finalKey = isVideo
      ? `${UPLOAD_KEY_PREFIX}${sanitizedBase}-video.${extension}`
      : `${UPLOAD_KEY_PREFIX}${sanitizedBase}.${extension}`;

    // coverImageKey a guardar (si es video, se apunta al JPG asociado)
    const coverImageKey = isVideo
      ? `${UPLOAD_KEY_PREFIX}${sanitizedBase}.jpg`
      : finalKey;

    // Generar presigned POST, PUT o multipart
    if (fileSize <= MAX_SIMPLE_UPLOAD_SIZE) {
      const { url, fields } = await createPresignedPost(client, {
        Bucket: bucket,
        Key: finalKey,
        Conditions: [
          ['content-length-range', 0, MAX_SIMPLE_UPLOAD_SIZE],
          ['eq', '$Content-Type', contentType],
        ],
        Fields: {
          'Content-Type': contentType,
          acl: 'public-read',
        },
        Expires: 3600,
      });
      return NextResponse.json({
        url,
        fields,
        key: finalKey,
        fileName: finalKey,
        uploadType: 'simple',
        contentType,
        coverImageKey,
      });
    } else if (fileSize <= MAX_PUT_UPLOAD_SIZE) {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: finalKey,
        ContentType: contentType,
        ContentLength: fileSize,
        ACL: 'public-read',
      });

      const signedUrl = await getSignedUrl(client, command, {
        expiresIn: 3600,
      });

      return NextResponse.json({
        url: signedUrl,
        key: finalKey,
        fileName: finalKey,
        uploadType: 'put',
        contentType,
        coverImageKey,
      });
    } else {
      const initResponse = await client.send(
        new CreateMultipartUploadCommand({
          Bucket: bucket,
          Key: finalKey,
          ContentType: contentType,
          ACL: 'public-read',
        })
      );

      const partSize = MULTIPART_PART_SIZE;
      const totalParts = Math.ceil(fileSize / partSize);

      return NextResponse.json({
        uploadType: 'multipart',
        key: finalKey,
        fileName: finalKey,
        uploadId: initResponse.UploadId,
        contentType,
        coverImageKey,
        partSize,
        totalParts,
      });
    }
  } catch (error) {
    console.error('❌ Error en la carga (POST):', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Error desconocido' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Only staff (educador/admin/super-admin) delete course media; students
    // never call this.
    const authz = await authorizeStaff();
    if (!authz.ok) {
      return jsonError(
        authz.status === 401 ? 'No autorizado' : 'Acceso denegado',
        authz.status
      );
    }

    const { bucket, client } = getS3Config();
    const body = (await request.json()) as { key?: unknown };
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Se requiere una key para eliminar el archivo' },
        { status: 400 }
      );
    }

    // Only objects issued by this route can be deleted through it.
    if (!isManagedKey(key)) {
      return jsonError('Key no válida', 400);
    }

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    return NextResponse.json({
      message: 'Archivo eliminado con éxito',
    });
  } catch (error) {
    console.error('❌ Error al eliminar el archivo:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error desconocido al eliminar el archivo',
      },
      { status: 500 }
    );
  }
}
