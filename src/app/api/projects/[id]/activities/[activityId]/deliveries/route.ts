import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '~/server/db';
import {
  projectActivityDeliveries,
  projects,
  projectActivities,
} from '~/server/db/schema';
import { eq, and } from 'drizzle-orm';

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

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

// GET - Obtener entrega de actividad
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

    // Buscar entrega por actividad y usuario actual
    const delivery = await db
      .select()
      .from(projectActivityDeliveries)
      .where(
        and(
          eq(projectActivityDeliveries.activityId, activityIdNum),
          eq(projectActivityDeliveries.userId, userId)
        )
      )
      .limit(1);

    return NextResponse.json(delivery[0] || null);
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

    const body = await req.json();
    console.log('Datos recibidos:', body);

    const {
      documentKey,
      documentName,
      imageKey,
      imageName,
      videoKey,
      videoName,
      compressedFileKey,
      compressedFileName,
      comentario,
      entregaUrl,
    } = body;

    // Validar que al menos haya algo para entregar
    const hasFiles = documentKey || imageKey || videoKey || compressedFileKey;
    const hasComment = comentario && comentario.trim().length > 0;
    const hasUrl = entregaUrl && entregaUrl.trim().length > 0;

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
      documentKey: documentKey || null,
      documentName: documentName || null,
      imageKey: imageKey || null,
      imageName: imageName || null,
      videoKey: videoKey || null,
      videoName: videoName || null,
      compressedFileKey: compressedFileKey || null,
      compressedFileName: compressedFileName || null,
      comentario: comentario || null,
      entregaUrl: entregaUrl || null,
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
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
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

    const body = await req.json();
    console.log('Datos para actualizar:', body);

    const {
      documentKey,
      documentName,
      imageKey,
      imageName,
      videoKey,
      videoName,
      compressedFileKey,
      compressedFileName,
      comentario,
      entregaUrl,
    } = body;

    // Validar que al menos haya algo para entregar
    const hasFiles = documentKey || imageKey || videoKey || compressedFileKey;
    const hasComment = comentario && comentario.trim().length > 0;
    const hasUrl = entregaUrl && entregaUrl.trim().length > 0;

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
      documentKey: documentKey || null,
      documentName: documentName || null,
      imageKey: imageKey || null,
      imageName: imageName || null,
      videoKey: videoKey || null,
      videoName: videoName || null,
      compressedFileKey: compressedFileKey || null,
      compressedFileName: compressedFileName || null,
      comentario: comentario || null,
      entregaUrl: entregaUrl || null,
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
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return respondWithError(`Error al actualizar la entrega: ${errorMessage}`, 500);
  }
}
