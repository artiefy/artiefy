import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '~/server/db';
import {
  projectActivityDeliveries,
  projects,
  projectActivities,
} from '~/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

// Función helper para verificar permisos de descarga
async function verificarPermisosDescarga(
  userId: string,
  projectId: number,
  activityId: number
) {
  console.log('Verificando permisos descarga:', {
    userId,
    projectId,
    activityId,
  });

  // Obtener información del proyecto
  const [projectInfo] = await db
    .select({
      projectUserId: projects.userId,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!projectInfo) {
    console.log('Proyecto no encontrado');
    return false;
  }

  // Obtener información de la actividad
  const [activityInfo] = await db
    .select({
      responsibleUserId: projectActivities.responsibleUserId,
    })
    .from(projectActivities)
    .where(eq(projectActivities.id, activityId))
    .limit(1);

  // El usuario puede descargar si es:
  // 1. El responsable del proyecto
  const esResponsableProyecto = projectInfo.projectUserId === userId;

  // 2. El responsable de la actividad específica
  const esResponsableActividad = activityInfo?.responsibleUserId === userId;

  console.log('Validación permisos descarga:', {
    esResponsableProyecto,
    esResponsableActividad,
  });

  return esResponsableProyecto || esResponsableActividad;
}

// GET - Descargar archivo de entrega
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

    const { id, activityId } = await context.params;
    const projectId = Number(id);
    const activityIdNum = Number(activityId);

    if (isNaN(projectId) || isNaN(activityIdNum)) {
      return respondWithError('IDs inválidos', 400);
    }

    // Obtener parámetros de la URL
    const url = new URL(req.url);
    const fileType = url.searchParams.get('type'); // 'document', 'image', 'video', 'compressed'
    const deliveryUserId = url.searchParams.get('userId'); // ID del usuario que hizo la entrega

    if (!fileType || !deliveryUserId) {
      return respondWithError(
        'Parámetros faltantes: type y userId son requeridos',
        400
      );
    }

    console.log('Descarga solicitada:', {
      fileType,
      deliveryUserId,
      userId,
      projectId,
      activityIdNum,
    });

    // Verificar permisos de descarga
    const tienePermisos = await verificarPermisosDescarga(
      userId,
      projectId,
      activityIdNum
    );
    if (!tienePermisos) {
      return respondWithError(
        'No tienes permisos para descargar archivos de esta actividad',
        403
      );
    }

    // Buscar la entrega
    const [delivery] = await db
      .select()
      .from(projectActivityDeliveries)
      .where(
        and(
          eq(projectActivityDeliveries.activityId, activityIdNum),
          eq(projectActivityDeliveries.userId, deliveryUserId)
        )
      )
      .limit(1);

    if (!delivery) {
      return respondWithError('Entrega no encontrada', 404);
    }

    // Obtener la key del archivo según el tipo
    let fileKey: string | null = null;
    let fileName: string | null = null;

    switch (fileType) {
      case 'document':
        fileKey = delivery.documentKey;
        fileName = delivery.documentName;
        break;
      case 'image':
        fileKey = delivery.imageKey;
        fileName = delivery.imageName;
        break;
      case 'video':
        fileKey = delivery.videoKey;
        fileName = delivery.videoName;
        break;
      case 'compressed':
        fileKey = delivery.compressedFileKey;
        fileName = delivery.compressedFileName;
        break;
      default:
        return respondWithError('Tipo de archivo no válido', 400);
    }

    if (!fileKey) {
      return respondWithError(
        `No hay archivo de tipo ${fileType} en esta entrega`,
        404
      );
    }

    // Generar URL de descarga firmada
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileKey,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hora
    });

    console.log('URL de descarga generada exitosamente');

    return NextResponse.json({
      downloadUrl,
      fileName: fileName || `archivo_${fileType}`,
      fileType,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Error al generar URL de descarga:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(
      `Error al generar la descarga: ${errorMessage}`,
      500
    );
  }
}
