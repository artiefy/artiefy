// src/app/api/super-admin/get-upload-url/route.ts
import { type NextRequest, NextResponse } from 'next/server';

import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { v4 as uuidv4 } from 'uuid';

const REGION = process.env.AWS_REGION ?? 'us-east-2';
const BUCKET = process.env.AWS_BUCKET_NAME ?? '';

if (!BUCKET) {
  throw new Error('Falta AWS_BUCKET_NAME en variables de entorno');
}

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface RequestBody {
  fileName?: string;
  fileType?: string;
  prefix?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { fileName, fileType, prefix } = body;

    if (!fileName || !fileType || !prefix) {
      return NextResponse.json(
        { error: 'fileName, fileType y prefix son requeridos' },
        { status: 400 }
      );
    }

    // Determinar extensión de forma segura
    const fileTypeStr = String(fileType).toLowerCase();
    const ext = fileTypeStr.includes('pdf')
      ? '.pdf'
      : fileTypeStr.includes('png')
        ? '.png'
        : fileTypeStr.includes('jpeg') || fileTypeStr.includes('jpg')
          ? '.jpg'
          : '';

    const key = `documents/${prefix}/${uuidv4()}${ext}`;

    const { url, fields } = await createPresignedPost(s3, {
      Bucket: BUCKET,
      Key: key,
      Conditions: [
        ['content-length-range', 0, 10485760], // 10MB max
      ],
      Fields: {
        'Content-Type': fileType,
      },
      Expires: 3600,
    });

    const finalUrl = `https://s3.${REGION}.amazonaws.com/${BUCKET}/${key}`;

    return NextResponse.json({
      uploadUrl: url,
      fields,
      key,
      finalUrl,
    });
  } catch (error) {
    console.error('[GET_UPLOAD_URL] Error:', error);
    return NextResponse.json(
      { error: 'Error generando URL de subida' },
      { status: 500 }
    );
  }
}
