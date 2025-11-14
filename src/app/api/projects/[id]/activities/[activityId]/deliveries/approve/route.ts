import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectActivityDeliveries, projects } from '~/server/db/schema';

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

// POST - Aprobar/rechazar entrega
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

    // Verificar que el usuario sea el responsable del proyecto
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project?.userId !== userId) {
      return respondWithError(
        'No tienes permisos para aprobar entregas en este proyecto',
        403
      );
    }

    const body = await req.json();
    const { userId: estudianteUserId, aprobado, feedback } = body;

    // Actualizar la entrega
    const [delivery] = await db
      .update(projectActivityDeliveries)
      .set({
        aprobado,
        feedback,
        aprobadoAt: aprobado ? new Date() : null,
      })
      .where(
        and(
          eq(projectActivityDeliveries.activityId, activityIdNum),
          eq(projectActivityDeliveries.userId, estudianteUserId as string)
        )
      )
      .returning();

    if (!delivery) {
      return respondWithError('Entrega no encontrada', 404);
    }

    return NextResponse.json({
      message: aprobado ? 'Entrega aprobada exitosamente' : 'Entrega rechazada',
      delivery,
    });
  } catch (error) {
    console.error('Error al procesar aprobación:', error);
    return respondWithError('Error al procesar la aprobación', 500);
  }
}
