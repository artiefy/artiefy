/**
 * Módulo para descargar y procesar archivos de S3
 * Obtiene archivos asociados a cursos, lecciones y actividades
 */

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Descarga un archivo de S3 como ArrayBuffer
 *
 * @param key - Clave del archivo en S3
 * @returns ArrayBuffer del archivo
 */
export async function downloadFileFromS3(key: string): Promise<ArrayBuffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error(`No body en respuesta S3 para ${key}`);
    }

    // Convertir stream a buffer usando el método recomendado de AWS SDK v3
    const byteArray = await response.Body.transformToByteArray();
    const result = new Uint8Array(byteArray);

    return result.buffer;
  } catch (error) {
    console.error(`❌ Error descargando ${key}:`, error);
    throw error;
  }
}

/**
 * Descarga múltiples archivos de S3
 *
 * @param keys - Array de claves S3
 * @returns Promise<Map<key, ArrayBuffer>>
 */
export async function downloadMultipleFilesFromS3(
  keys: string[]
): Promise<Map<string, ArrayBuffer | null>> {
  const results = new Map<string, ArrayBuffer | null>();

  for (const key of keys) {
    try {
      const buffer = await downloadFileFromS3(key);
      results.set(key, buffer);
      console.log(`✅ Descargado: ${key}`);
    } catch (error) {
      console.error(`⚠️ Error descargando ${key}:`, error);
      results.set(key, null);
    }
  }

  return results;
}
