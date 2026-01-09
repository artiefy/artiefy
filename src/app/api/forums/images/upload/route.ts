// src/app/api/forums/images/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { auth } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function uploadImageToS3(
  base64Data: string,
  userId: string
): Promise<string> {
  // Extraer el contenido base64 del data URI si existe
  const base64Content = base64Data.includes(',')
    ? base64Data.split(',')[1]!
    : base64Data;

  const buffer = Buffer.from(base64Content, 'base64');

  // Detectar el tipo MIME de la imagen
  const mimeMatch = base64Data.match(/^data:image\/(.*?);base64,/);
  const extension = mimeMatch?.[1] ?? 'jpg';
  const contentType = `image/${extension}`;

  const key = `forums/${userId}/forum-image-${uuidv4()}.${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    })
  );

  return key;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No se proporcionó imagen' },
        { status: 400 }
      );
    }

    const imageKey = await uploadImageToS3(image, userId);

    // Construir la URL pública de la imagen
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;

    return NextResponse.json({ imageKey, imageUrl }, { status: 200 });
  } catch (error) {
    console.error('Error al subir imagen del foro:', error);
    return NextResponse.json(
      { error: 'Error al subir la imagen' },
      { status: 500 }
    );
  }
}
