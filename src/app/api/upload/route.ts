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

const MAX_SIMPLE_UPLOAD_SIZE = 500 * 1024 * 1024; // 500 MB
const MAX_PUT_UPLOAD_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB (limite PUT en S3)
const MAX_VIDEO_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB
const MAX_FILE_SIZE = 25 * 1024 * 1024 * 1024; // 25 GB
const MULTIPART_PART_SIZE = 100 * 1024 * 1024; // 100 MB

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
    const { bucket, client } = getS3Config();
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

    if (isVideo && fileSize > MAX_VIDEO_SIZE) {
      throw new Error('❌ Video demasiado grande (> 10GB)');
    }

    if (!isVideo && fileSize > MAX_FILE_SIZE) {
      throw new Error('❌ Archivo demasiado grande (> 25GB)');
    }

    // coverImageKey a guardar (si es video, se apunta al JPG asociado)
    const coverImageKey =
      fileType === 'image' ? finalKey : `uploads/${sanitizedBase}.jpg`;

    // Generar presigned POST, PUT o multipart
    if (fileSize <= MAX_SIMPLE_UPLOAD_SIZE) {
      const { url, fields } = await createPresignedPost(client, {
        Bucket: bucket,
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
    const { bucket, client } = getS3Config();
    const body = (await request.json()) as { key: string };
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Se requiere una key para eliminar el archivo' },
        { status: 400 }
      );
    }

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
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
