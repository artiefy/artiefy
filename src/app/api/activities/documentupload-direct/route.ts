import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface DocumentMetadata {
  key: string;
  fileUrl: string;
  fileName: string;
  status: 'pending' | 'reviewed';
  grade?: number;
  feedback?: string;
}

const sanitizeFilename = (value: string): string => {
  const normalized = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const cleaned = normalized
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!cleaned) return 'archivo';

  const maxLength = 120;
  if (cleaned.length <= maxLength) return cleaned;

  const extMatch = cleaned.match(/(\.[a-zA-Z0-9]{1,8})$/);
  const ext = extMatch?.[1] ?? '';
  const base = cleaned.slice(0, maxLength - ext.length);
  return `${base}${ext}`;
};

const resolveContentType = (
  filename: string,
  providedContentType?: string
): string => {
  const trimmed = providedContentType?.trim();
  if (trimmed) return trimmed;

  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
  };

  return map[ext] ?? 'application/octet-stream';
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const activityIdRaw = formData.get('activityId');
    const userIdRaw = formData.get('userId');

    if (!(file instanceof File)) {
      return Response.json(
        { success: false, error: 'Missing file' },
        { status: 400 }
      );
    }

    if (typeof activityIdRaw !== 'string' || typeof userIdRaw !== 'string') {
      return Response.json(
        { success: false, error: 'Missing activityId or userId' },
        { status: 400 }
      );
    }

    const activityId = Number.parseInt(activityIdRaw, 10);
    const userId = userIdRaw.trim();

    if (Number.isNaN(activityId) || !userId) {
      return Response.json(
        { success: false, error: 'Invalid activityId or userId' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json(
        { success: false, error: 'File too large (max 10MB)' },
        { status: 413 }
      );
    }

    const client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const safeFilename = sanitizeFilename(file.name);
    const contentType = resolveContentType(file.name, file.type);
    const key = `documents/${activityId}/${userId}/${uuidv4()}-${safeFilename}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    console.info('[documentupload-direct] Uploading file through server', {
      activityId,
      userId,
      key,
      contentType,
      size: file.size,
    });

    await client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: fileBuffer,
        ACL: 'public-read',
        ContentType: contentType,
      })
    );

    const fileUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${key}`;

    const metadata: DocumentMetadata = {
      key,
      fileUrl,
      fileName: file.name,
      status: 'pending',
    };
    const documentKey = `document:${activityId}:${userId}`;
    await redis.set(documentKey, metadata);

    console.info('[documentupload-direct] Upload completed', {
      activityId,
      userId,
      key,
      documentKey,
    });

    return Response.json({
      success: true,
      key,
      fileUrl,
    });
  } catch (error) {
    console.error('[documentupload-direct] Upload error:', error);
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
