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

    const body = await req.json();
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

    const [delivery] = await db
      .insert(projectActivityDeliveries)
      .values({
        activityId: activityIdNum,
        userId,
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
        fileTypes: JSON.stringify(fileTypes),
        totalFiles,
        entregado: totalFiles > 0 || !!comentario,
      })
      .returning();

    console.log('Entrega creada:', delivery);
    return NextResponse.json(delivery);
  } catch (error) {
    console.error('Error al crear entrega:', error);
    return respondWithError('Error al crear la entrega', 500);
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

    const body = await req.json();
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

    const [delivery] = await db
      .update(projectActivityDeliveries)
      .set({
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
        fileTypes: JSON.stringify(fileTypes),
        totalFiles,
        entregado: totalFiles > 0 || !!comentario,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectActivityDeliveries.activityId, activityIdNum),
          eq(projectActivityDeliveries.userId, userId)
        )
      )
      .returning();

    if (!delivery) return respondWithError('Entrega no encontrada', 404);

    return NextResponse.json(delivery);
  } catch (error) {
    console.error('Error al actualizar entrega:', error);
    return respondWithError('Error al actualizar la entrega', 500);
  }
}
