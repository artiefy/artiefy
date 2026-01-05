import { NextResponse } from 'next/server';

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const MAX_SIMPLE_UPLOAD_SIZE = 500 * 1024 * 1024; // 500 MB
const MAX_FILE_SIZE = 25 * 1024 * 1024 * 1024; // 25 GB

const client = new S3Client({ region: process.env.AWS_REGION });

function sanitizeFileName(fileName: string): string {
  const ext = fileName.split('.').pop() ?? '';
  const timestamp = Date.now();
  const baseName = fileName
    .split('.')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .trim();

  return `${baseName}-${timestamp}-${uuidv4()}.${ext}`;
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('❌ Error al parsear JSON:', jsonError);
      return NextResponse.json(
        { error: 'El cuerpo de la solicitud no es un JSON válido' },
        { status: 400 }
      );
    }

    const { contentType, fileSize, fileName } = body as {
      contentType: string;
      fileSize: number;
      fileName: string;
    };

    if (!contentType || !fileSize || !fileName) {
      return NextResponse.json(
        { error: 'Se requieren contentType, fileSize y fileName' },
        { status: 400 }
      );
    }

    if (!process.env.AWS_BUCKET_NAME) {
      throw new Error('AWS_BUCKET_NAME no está definido');
    }

    console.log('📦 Iniciando carga...');
    console.log('➡️ Tipo:', contentType);
    console.log('➡️ Tamaño:', fileSize);
    console.log('➡️ Nombre original:', fileName);

    const isVideo = contentType.startsWith('video/');
    const isImage = contentType.startsWith('image/');
    const isDoc =
      contentType === 'application/pdf' ||
      contentType === 'application/msword' ||
      contentType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      contentType ===
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      contentType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (!isVideo && !isImage && !isDoc) {
      throw new Error('❌ Tipo de archivo no permitido');
    }

    let finalKey = '';
    let sanitizedBase = '';
    const fileType: 'video' | 'image' = isVideo ? 'video' : 'image';
    const extension = fileName.split('.').pop() ?? 'bin';

    // Detectar si ya viene un path limpio como 'uploads/xyz.jpg'
    const isPresanitized =
      fileName.startsWith('uploads/') && !fileName.includes(' ');

    if (isPresanitized) {
      finalKey = fileName;
      sanitizedBase = fileName
        .replace(/^uploads\//, '')
        .replace(/\.[^.]+$/, '');
      console.log(`📝 Usando key ya formateado: ${finalKey}`);
    } else {
      const sanitizedFullName = sanitizeFileName(fileName);
      sanitizedBase = sanitizedFullName.split('.')[0];

      if (isVideo) {
        finalKey = `uploads/${sanitizedBase}-video.${extension}`;
        console.log(`🎬 Se subirá como video. Key: ${finalKey}`);
      } else {
        finalKey = `uploads/${sanitizedBase}.${extension}`;
        console.log(`🖼️ Se subirá como imagen. Key: ${finalKey}`);
      }
    }

    if (fileSize > MAX_FILE_SIZE) {
      throw new Error('❌ Archivo demasiado grande (> 25GB)');
    }

    // coverImageKey a guardar (si es video, se apunta al JPG asociado)
    const coverImageKey =
      fileType === 'image' ? finalKey : `uploads/${sanitizedBase}.jpg`;

    // Generar presigned POST o PUT
    if (fileSize <= MAX_SIMPLE_UPLOAD_SIZE) {
      const { url, fields } = await createPresignedPost(client, {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: finalKey,
        Conditions: [
          ['content-length-range', 0, MAX_SIMPLE_UPLOAD_SIZE],
          ['starts-with', '$Content-Type', ''],
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
    } else {
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
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
    const body = (await request.json()) as { key: string };
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Se requiere una key para eliminar el archivo' },
        { status: 400 }
      );
    }

    if (!process.env.AWS_BUCKET_NAME) {
      throw new Error('AWS_BUCKET_NAME no está definido');
    }

    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      })
    );

    console.log('🗑️ Archivo eliminado de S3:', key);

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
