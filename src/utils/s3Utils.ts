import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export function sanitizeFileName(fileName: string): string {
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

export async function deleteS3File(key: string): Promise<void> {
  try {
    if (!process.env.AWS_BUCKET_NAME) {
      throw new Error('AWS_BUCKET_NAME no está definido');
    }

    if (!process.env.AWS_REGION) {
      throw new Error('AWS_REGION no está definido');
    }

    const client = new S3Client({ region: process.env.AWS_REGION });

    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      })
    );

    console.log('🗑️ Archivo eliminado de S3:', key);
  } catch (error) {
    console.error('❌ Error eliminando archivo de S3:', error);
    throw error;
  }
}
