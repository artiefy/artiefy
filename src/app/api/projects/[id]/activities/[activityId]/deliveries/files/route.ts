import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '~/server/db';
import { projectActivityDeliveries } from '~/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

// Configurar cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// GET - Obtener URL firmada para un archivo específico
export async function GET(
  req: Request,
  context: {
    params: Promise<{
      id: string;
      activityId: string;
    }>;
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) return respondWithError('No autorizado', 401);

    const { activityId } = await context.params;
    const activityIdNum = Number(activityId);
    if (isNaN(activityIdNum))
      return respondWithError('ID de actividad inválido', 400);

    const url = new URL(req.url);
    const fileKey = url.searchParams.get('key');
    const fileType = url.searchParams.get('type');

    if (!fileKey || !fileType) {
      return respondWithError('Key y type del archivo son requeridos', 400);
    }

    // Verificar que el usuario tiene acceso a esta entrega
    const [delivery] = await db
      .select()
      .from(projectActivityDeliveries)
      .where(
        and(
          eq(projectActivityDeliveries.activityId, activityIdNum),
          eq(projectActivityDeliveries.userId, userId)
        )
      )
      .limit(1);

    if (!delivery) {
      return respondWithError('Entrega no encontrada', 404);
    }

    // Verificar que el archivo pertenece a esta entrega
    const validKeys = [
      delivery.documentKey,
      delivery.imageKey,
      delivery.videoKey,
      delivery.compressedFileKey,
    ].filter(Boolean);

    if (!validKeys.includes(fileKey)) {
      return respondWithError('Archivo no autorizado', 403);
    }

    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: fileKey,
      });

      // URL válida por 1 hora
      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });

      return NextResponse.json({
        url: signedUrl,
        fileName: getFileNameByType(delivery, fileType),
        fileType,
        expiresIn: 3600,
      });
    } catch (error) {
      console.error(`Error generando URL firmada para ${fileKey}:`, error);
      return respondWithError('Error al generar URL del archivo', 500);
    }
  } catch (error) {
    console.error('Error al obtener archivo:', error);
    return respondWithError('Error al obtener el archivo', 500);
  }
}

function getFileNameByType(delivery: any, fileType: string): string {
  switch (fileType) {
    case 'document':
      return delivery.documentName || 'Documento';
    case 'image':
      return delivery.imageName || 'Imagen';
    case 'video':
      return delivery.videoName || 'Video';
    case 'compressed':
      return delivery.compressedFileName || 'Archivo comprimido';
    default:
      return 'Archivo';
  }
}
