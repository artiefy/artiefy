import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const REGION = process.env.AWS_REGION ?? 'us-east-2';
const BUCKET = process.env.AWS_S3_BUCKET ?? process.env.AWS_BUCKET_NAME ?? '';
const PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_AWS_S3_URL ??
  `https://s3.${REGION}.amazonaws.com/${BUCKET}`;

if (!BUCKET) throw new Error('Falta AWS_S3_BUCKET o AWS_BUCKET_NAME');

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export type MediaType = 'image' | 'audio' | 'video';

interface UploadResult {
  key: string;
  url: string;
}

/**
 * Obtiene la extensión de archivo correcta basada en el tipo MIME
 */
function getFileExtension(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'audio/webm': '.webm',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
  };

  return typeMap[mimeType] || '.bin';
}

/**
 * Valida el tipo de archivo según el tipo de media esperado
 */
function validateMediaType(file: File, mediaType: MediaType): boolean {
  const mimeType = file.type.toLowerCase();

  switch (mediaType) {
    case 'image':
      return mimeType.startsWith('image/');
    case 'audio':
      return mimeType.startsWith('audio/');
    case 'video':
      return mimeType.startsWith('video/');
    default:
      return false;
  }
}

/**
 * Limita el tamaño del archivo según el tipo de media
 */
function validateFileSize(file: File, mediaType: MediaType): boolean {
  const maxSizes: Record<MediaType, number> = {
    image: 5 * 1024 * 1024, // 5MB
    audio: 50 * 1024 * 1024, // 50MB
    video: 200 * 1024 * 1024, // 200MB
  };

  return file.size <= maxSizes[mediaType];
}

/**
 * Sube un archivo de media a S3
 * @param file - El archivo a subir
 * @param mediaType - Tipo de media: 'image', 'audio', 'video'
 * @param userId - ID del usuario que sube el archivo
 * @param forumId - ID del foro (opcional)
 * @returns Promise con la clave y URL del archivo en S3
 */
export async function uploadMediaToS3(
  file: File,
  mediaType: MediaType,
  userId: string,
  forumId?: number
): Promise<UploadResult> {
  // Validar tipo de media
  if (!validateMediaType(file, mediaType)) {
    throw new Error(`El archivo no es un ${mediaType} válido`);
  }

  // Validar tamaño
  if (!validateFileSize(file, mediaType)) {
    const maxSizes: Record<MediaType, string> = {
      image: '5MB',
      audio: '50MB',
      video: '200MB',
    };
    throw new Error(`El archivo es muy grande. Máximo: ${maxSizes[mediaType]}`);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = getFileExtension(file.type);

  // Determinar la carpeta base según el tipo de media
  const folderMap: Record<MediaType, string> = {
    image: 'uploads',
    audio: 'audio',
    video: 'video_clase',
  };

  const baseFolder = folderMap[mediaType];
  const timestamp = Date.now();
  const uuid = uuidv4();
  const key = `${baseFolder}/${timestamp}-${uuid}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buf,
      ContentType: file.type || 'application/octet-stream',
      ACL: 'public-read',
    })
  );

  const url = `${PUBLIC_BASE_URL}/${key}`;
  console.log(`✅ Archivo ${mediaType} subido a S3: ${url}`);

  return { key, url };
}

/**
 * Elimina un archivo de S3
 * @param key - La clave del archivo en S3
 */
export async function deleteMediaFromS3(key: string): Promise<void> {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    console.log(`✅ Archivo eliminado de S3: ${key}`);
  } catch (error) {
    console.error(`❌ Error al eliminar archivo de S3: ${key}`, error);
    throw error;
  }
}

/**
 * Genera URL pública a partir de una clave S3
 */
export function getPublicUrl(key: string): string {
  return `${PUBLIC_BASE_URL}/${key}`;
}
