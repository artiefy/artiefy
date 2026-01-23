// src/app/api/super-admin/upload/route.ts

import { NextResponse } from 'next/server';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// 📌 Configuración de S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    console.log('📸 [POST /api/super-admin/upload] Archivo recibido:', {
      name: file.name,
      type: file.type,
      size: file.size,
      folder,
    });

    // Convertir archivo a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Detectar extensión del archivo
    const extension = file.type.includes('png')
      ? 'png'
      : file.type.includes('jpeg') || file.type.includes('jpg')
        ? 'jpg'
        : file.type.includes('webp')
          ? 'webp'
          : 'jpg';

    // Generar key para S3
    const key = `${folder || 'uploads'}/${uuidv4()}.${extension}`;
    console.log('📸 [upload] Key generado:', key);
    console.log('📸 [upload] Bucket:', process.env.AWS_BUCKET_NAME);

    // Subir a S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ACL: 'public-read',
      })
    );

    console.log(`✅ [upload] Imagen subida exitosamente a S3: ${key}`);

    return NextResponse.json({
      key,
      url: `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${key}`,
    });
  } catch (error) {
    console.error('❌ [upload] Error:', error);
    return NextResponse.json(
      { error: 'Error al subir la imagen' },
      { status: 500 }
    );
  }
}
