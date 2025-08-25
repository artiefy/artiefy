import { NextResponse } from 'next/server';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  projectActivities,
  projectActivityDeliveries,
  projects,
} from '~/server/db/schema';

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

// Función helper para eliminar archivo de S3
async function deleteFileFromS3(key: string): Promise<boolean> {
  if (!key) return true; // Si no hay key, no hay nada que eliminar

  try {
    console.log(`🗑️ Eliminando archivo de S3: ${key}`);

    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
    });

    await s3Client.send(deleteCommand);
    console.log(`✅ Archivo eliminado exitosamente de S3: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Error eliminando archivo de S3 (${key}):`, error);
    return false;
  }
}

// Función helper para verificar permisos de entrega
async function verificarPermisosEntrega(
  userId: string,
  projectId: number,
  activityId: number
) {
  console.log('Verificando permisos API:', { userId, projectId, activityId });

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

  console.log('Info del proyecto:', projectInfo);

  // Obtener información de la actividad
  const [activityInfo] = await db
    .select({
      responsibleUserId: projectActivities.responsibleUserId,
    })
    .from(projectActivities)
    .where(eq(projectActivities.id, activityId))
    .limit(1);

  console.log('Info de la actividad:', activityInfo);

  // El usuario puede entregar si es:
  // 1. El responsable del proyecto
  const esResponsableProyecto = projectInfo.projectUserId === userId;

  // 2. El responsable de la actividad específica
  const esResponsableActividad = activityInfo?.responsibleUserId === userId;

  console.log('Validación permisos:', {
    esResponsableProyecto,
    esResponsableActividad,
    projectUserId: projectInfo.projectUserId,
    activityResponsibleUserId: activityInfo?.responsibleUserId,
    userId,
  });

  return esResponsableProyecto || esResponsableActividad;
}

// Función helper para generar URL firmada de S3
async function getSignedUrlForFile(key: string): Promise<string | null> {
  if (!key) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
    });

    // URL válida por 1 hora
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    return signedUrl;
  } catch (error) {
    console.error(`Error generando URL firmada para ${key}:`, error);
    return null;
  }
}

// Define a type for delivery (adjust fields as needed)
interface Delivery {
  documentKey?: string | null;
  documentName?: string | null;
  imageKey?: string | null;
  imageName?: string | null;
  videoKey?: string | null;
  videoName?: string | null;
  compressedFileKey?: string | null;
  compressedFileName?: string | null;
  comentario?: string | null;
  entregaUrl?: string | null;
  [key: string]: unknown;
}

// Función helper para obtener información de archivos con URLs
async function getFilesInfo(delivery: Delivery) {
  const files = [];

  if (
    (delivery as Delivery).documentKey &&
    typeof (delivery as Delivery).documentName === 'string'
  ) {
    const url = await getSignedUrlForFile((delivery as Delivery).documentKey!);
    files.push({
      type: 'document',
      name: (delivery as Delivery).documentName,
      key: (delivery as Delivery).documentKey,
      url,
      icon: '📄',
    });
  }

  if (
    (delivery as Delivery).imageKey &&
    typeof (delivery as Delivery).imageName === 'string'
  ) {
    const url = await getSignedUrlForFile((delivery as Delivery).imageKey!);
    files.push({
      type: 'image',
      name: (delivery as Delivery).imageName,
      key: (delivery as Delivery).imageKey,
      url,
      icon: '🖼️',
    });
  }

  if (
    (delivery as Delivery).videoKey &&
    typeof (delivery as Delivery).videoName === 'string'
  ) {
    const url = await getSignedUrlForFile((delivery as Delivery).videoKey!);
    files.push({
      type: 'video',
      name: (delivery as Delivery).videoName,
      key: (delivery as Delivery).videoKey,
      url,
      icon: '🎥',
    });
  }

  if (
    (delivery as Delivery).compressedFileKey &&
    typeof (delivery as Delivery).compressedFileName === 'string'
  ) {
    const url = await getSignedUrlForFile(
      (delivery as Delivery).compressedFileKey!
    );
    files.push({
      type: 'compressed',
      name: (delivery as Delivery).compressedFileName,
      key: (delivery as Delivery).compressedFileKey,
      url,
      icon: '📦',
    });
  }

  return files;
}

// GET - Obtener entrega de actividad
export async function GET(
  _req: Request,
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

    // Buscar entrega por actividad y usuario actual
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
      return NextResponse.json(null);
    }

    // Obtener información de archivos con URLs firmadas
    const files = await getFilesInfo(delivery as Delivery);

    // Preparar respuesta enriquecida
    const enrichedDelivery = {
      ...delivery,
      files,
      filesCount: files.length,
      hasFiles: files.length > 0,
      hasComment:
        typeof delivery.comentario === 'string' &&
        delivery.comentario.trim().length > 0,
      hasUrl:
        typeof delivery.entregaUrl === 'string' &&
        delivery.entregaUrl.trim().length > 0,
    };

    return NextResponse.json(enrichedDelivery);
  } catch (error) {
    console.error('Error al obtener entrega:', error);
    return respondWithError('Error al obtener la entrega', 500);
  }
}

// POST - Crear nueva entrega
export async function POST(
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

    console.log(
      'POST entrega - Usuario:',
      userId,
      'Proyecto:',
      projectId,
      'Actividad:',
      activityIdNum
    );

    // Verificar que la actividad existe
    const [activityExists] = await db
      .select({ id: projectActivities.id })
      .from(projectActivities)
      .where(eq(projectActivities.id, activityIdNum))
      .limit(1);

    if (!activityExists) {
      return respondWithError('Actividad no encontrada', 404);
    }

    // Verificar permisos de entrega
    const tienePermisos = await verificarPermisosEntrega(
      userId,
      projectId,
      activityIdNum
    );
    if (!tienePermisos) {
      return respondWithError(
        'No tienes permisos para entregar esta actividad',
        403
      );
    }

    // Verificar si ya existe una entrega para esta actividad y usuario
    const [existingDelivery] = await db
      .select()
      .from(projectActivityDeliveries)
      .where(
        and(
          eq(projectActivityDeliveries.activityId, activityIdNum),
          eq(projectActivityDeliveries.userId, userId)
        )
      )
      .limit(1);

    if (existingDelivery) {
      return respondWithError('Ya existe una entrega para esta actividad', 409);
    }

    const body: {
      documentKey?: string;
      documentName?: string;
      imageKey?: string;
      imageName?: string;
      videoKey?: string;
      videoName?: string;
      compressedFileKey?: string;
      compressedFileName?: string;
      comentario?: string;
      entregaUrl?: string;
    } = await req.json();
    console.log('Datos recibidos:', body);

    // Only destructure used fields
    const {
      documentKey,
      imageKey,
      videoKey,
      compressedFileKey,
      comentario,
      entregaUrl,
    } = body;

    // Validar que al menos haya algo para entregar
    const hasFiles = documentKey ?? imageKey ?? videoKey ?? compressedFileKey;
    const hasComment =
      typeof comentario === 'string' && comentario.trim().length > 0;
    const hasUrl =
      typeof entregaUrl === 'string' && entregaUrl.trim().length > 0;

    if (!hasFiles && !hasComment && !hasUrl) {
      return respondWithError(
        'Debe proporcionar al menos un archivo, comentario o URL para la entrega',
        400
      );
    }

    // Calcular tipos de archivos y total
    const fileTypes = [];
    let totalFiles = 0;

    if (documentKey) {
      fileTypes.push('document');
      totalFiles++;
    }
    if (imageKey) {
      fileTypes.push('image');
      totalFiles++;
    }
    if (videoKey) {
      fileTypes.push('video');
      totalFiles++;
    }
    if (compressedFileKey) {
      fileTypes.push('compressed');
      totalFiles++;
    }

    const deliveryData = {
      activityId: activityIdNum,
      userId,
      documentKey: documentKey ?? null,
      documentName: body.documentName ?? null,
      imageKey: imageKey ?? null,
      imageName: body.imageName ?? null,
      videoKey: videoKey ?? null,
      videoName: body.videoName ?? null,
      compressedFileKey: compressedFileKey ?? null,
      compressedFileName: body.compressedFileName ?? null,
      comentario: comentario ?? null,
      entregaUrl: entregaUrl ?? null,
      fileTypes: fileTypes.length > 0 ? JSON.stringify(fileTypes) : null,
      totalFiles,
      entregado: totalFiles > 0 || hasComment || hasUrl,
    };

    console.log('Datos a insertar:', deliveryData);

    const [delivery] = await db
      .insert(projectActivityDeliveries)
      .values(deliveryData)
      .returning();

    console.log('Entrega creada exitosamente:', delivery);
    return NextResponse.json(delivery);
  } catch (error) {
    console.error('Error detallado al crear entrega:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(`Error al crear la entrega: ${errorMessage}`, 500);
  }
}

// PUT - Actualizar entrega existente
export async function PUT(
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

    console.log(
      'PUT entrega - Usuario:',
      userId,
      'Proyecto:',
      projectId,
      'Actividad:',
      activityIdNum
    );

    // Verificar permisos de entrega
    const tienePermisos = await verificarPermisosEntrega(
      userId,
      projectId,
      activityIdNum
    );
    if (!tienePermisos) {
      return respondWithError(
        'No tienes permisos para editar esta entrega',
        403
      );
    }

    // Verificar que existe la entrega
    const [existingDelivery] = await db
      .select()
      .from(projectActivityDeliveries)
      .where(
        and(
          eq(projectActivityDeliveries.activityId, activityIdNum),
          eq(projectActivityDeliveries.userId, userId)
        )
      )
      .limit(1);

    if (!existingDelivery) {
      return respondWithError('Entrega no encontrada', 404);
    }

    const body: {
      documentKey?: string;
      documentName?: string;
      imageKey?: string;
      imageName?: string;
      videoKey?: string;
      videoName?: string;
      compressedFileKey?: string;
      compressedFileName?: string;
      comentario?: string;
      entregaUrl?: string;
    } = await req.json();
    console.log('Datos para actualizar:', body);

    // Only destructure used fields
    const {
      documentKey,
      imageKey,
      videoKey,
      compressedFileKey,
      comentario,
      entregaUrl,
    } = body;

    // Validar que al menos haya algo para entregar
    const hasFiles = documentKey ?? imageKey ?? videoKey ?? compressedFileKey;
    const hasComment =
      typeof comentario === 'string' && comentario.trim().length > 0;
    const hasUrl =
      typeof entregaUrl === 'string' && entregaUrl.trim().length > 0;

    if (!hasFiles && !hasComment && !hasUrl) {
      return respondWithError(
        'Debe proporcionar al menos un archivo, comentario o URL para la entrega',
        400
      );
    }

    // Calcular tipos de archivos y total
    const fileTypes = [];
    let totalFiles = 0;

    if (documentKey) {
      fileTypes.push('document');
      totalFiles++;
    }
    if (imageKey) {
      fileTypes.push('image');
      totalFiles++;
    }
    if (videoKey) {
      fileTypes.push('video');
      totalFiles++;
    }
    if (compressedFileKey) {
      fileTypes.push('compressed');
      totalFiles++;
    }

    const updateData = {
      documentKey: body.documentKey ?? null,
      documentName: body.documentName ?? null,
      imageKey: body.imageKey ?? null,
      imageName: body.imageName ?? null,
      videoKey: body.videoKey ?? null,
      videoName: body.videoName ?? null,
      compressedFileKey: body.compressedFileKey ?? null,
      compressedFileName: body.compressedFileName ?? null,
      comentario: comentario ?? null,
      entregaUrl: entregaUrl ?? null,
      fileTypes: fileTypes.length > 0 ? JSON.stringify(fileTypes) : null,
      totalFiles,
      entregado: totalFiles > 0 || hasComment || hasUrl,
      updatedAt: new Date(),
    };

    console.log('Datos a actualizar:', updateData);

    const [delivery] = await db
      .update(projectActivityDeliveries)
      .set(updateData)
      .where(
        and(
          eq(projectActivityDeliveries.activityId, activityIdNum),
          eq(projectActivityDeliveries.userId, userId)
        )
      )
      .returning();

    if (!delivery) {
      return respondWithError('Error al actualizar la entrega', 500);
    }

    console.log('Entrega actualizada exitosamente:', delivery);
    return NextResponse.json(delivery);
  } catch (error) {
    console.error('Error detallado al actualizar entrega:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(
      `Error al actualizar la entrega: ${errorMessage}`,
      500
    );
  }
}

// DELETE - Eliminar entrega completamente
export async function DELETE(
  _req: Request,
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

    console.log(
      '🗑️ DELETE entrega - Usuario:',
      userId,
      'Proyecto:',
      projectId,
      'Actividad:',
      activityIdNum
    );

    // Verificar permisos de entrega
    const tienePermisos = await verificarPermisosEntrega(
      userId,
      projectId,
      activityIdNum
    );
    if (!tienePermisos) {
      return respondWithError(
        'No tienes permisos para eliminar esta entrega',
        403
      );
    }

    // Verificar que existe la entrega
    const [existingDelivery] = await db
      .select()
      .from(projectActivityDeliveries)
      .where(
        and(
          eq(projectActivityDeliveries.activityId, activityIdNum),
          eq(projectActivityDeliveries.userId, userId)
        )
      )
      .limit(1);

    if (!existingDelivery) {
      return respondWithError('Entrega no encontrada', 404);
    }

    // Recopilar todos los archivos a eliminar de S3
    const filesToDelete = [];
    const deliveryTyped = existingDelivery as Delivery;

    if (deliveryTyped.documentKey) {
      filesToDelete.push({
        key: deliveryTyped.documentKey,
        type: 'document',
        name:
          typeof deliveryTyped.documentName === 'string'
            ? deliveryTyped.documentName
            : 'Documento',
      });
    }

    if (deliveryTyped.imageKey) {
      filesToDelete.push({
        key: deliveryTyped.imageKey,
        type: 'image',
        name:
          typeof deliveryTyped.imageName === 'string'
            ? deliveryTyped.imageName
            : 'Imagen',
      });
    }

    if (deliveryTyped.videoKey) {
      filesToDelete.push({
        key: deliveryTyped.videoKey,
        type: 'video',
        name:
          typeof deliveryTyped.videoName === 'string'
            ? deliveryTyped.videoName
            : 'Video',
      });
    }

    if (deliveryTyped.compressedFileKey) {
      filesToDelete.push({
        key: deliveryTyped.compressedFileKey,
        type: 'compressed',
        name:
          typeof deliveryTyped.compressedFileName === 'string'
            ? deliveryTyped.compressedFileName
            : 'Archivo comprimido',
      });
    }

    console.log(
      `🗂️ Archivos a eliminar de S3 (${filesToDelete.length}):`,
      filesToDelete
    );

    // Eliminar archivos de S3
    const deletionResults = [];
    for (const file of filesToDelete) {
      const success = await deleteFileFromS3(file.key);
      deletionResults.push({
        file: file.name,
        type: file.type,
        key: file.key,
        success,
      });
    }

    console.log('📊 Resultados de eliminación S3:', deletionResults);

    // Verificar si hubo errores en la eliminación de S3
    const failedDeletions = deletionResults.filter((result) => !result.success);
    if (failedDeletions.length > 0) {
      console.warn(
        '⚠️ Algunos archivos no se pudieron eliminar de S3:',
        failedDeletions
      );
      // Continuar con la eliminación de la BD, pero logear la advertencia
    }

    // Eliminar completamente la entrega de la base de datos
    console.log('🗑️ Eliminando entrega de la base de datos...');

    const deletedEntries = await db
      .delete(projectActivityDeliveries)
      .where(
        and(
          eq(projectActivityDeliveries.activityId, activityIdNum),
          eq(projectActivityDeliveries.userId, userId)
        )
      )
      .returning();

    if (deletedEntries.length === 0) {
      return respondWithError(
        'Error al eliminar la entrega de la base de datos',
        500
      );
    }

    console.log(
      '✅ Entrega eliminada completamente de la base de datos:',
      deletedEntries[0]
    );

    // Preparar respuesta con resumen de eliminación
    const response = {
      message: 'Entrega eliminada exitosamente',
      delivery: deletedEntries[0],
      filesDeleted: {
        total: filesToDelete.length,
        successful: deletionResults.filter((r) => r.success).length,
        failed: failedDeletions.length,
        details: deletionResults,
      },
    };

    // Si hubo errores en S3, incluir advertencia en la respuesta
    if (failedDeletions.length > 0) {
      response.message += ` (Advertencia: ${failedDeletions.length} archivo(s) no se pudieron eliminar de S3)`;
    }

    console.log('🎉 Proceso de eliminación completado:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error crítico al eliminar entrega:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(
      `Error al eliminar la entrega: ${errorMessage}`,
      500
    );
  }
}
