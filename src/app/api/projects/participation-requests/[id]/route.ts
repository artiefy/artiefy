import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  projectParticipationRequests,
  projects,
  projectsTaken,
} from '~/server/db/schema';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 === INICIO PATCH SOLICITUD ===');

    const { userId } = await auth();
    if (!userId) {
      console.error('❌ Usuario no autenticado');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const solicitudId = parseInt(params.id);
    if (isNaN(solicitudId)) {
      console.error('❌ ID de solicitud inválido:', params.id);
      return NextResponse.json(
        { error: 'ID de solicitud inválido' },
        { status: 400 }
      );
    }

    console.log('📋 Procesando solicitud ID:', solicitudId);
    console.log('👤 Usuario responsable:', userId);

    // Use a typed interface for the request body to avoid 'any'
    interface PatchRequestBody {
      status: string;
      responseMessage?: string;
    }

    const body = (await request.json()) as PatchRequestBody;
    const { status, responseMessage } = body;

    console.log('📦 Datos recibidos:', { status, responseMessage });

    if (!['approved', 'rejected'].includes(status)) {
      console.error('❌ Estado inválido:', status);
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    // Obtener la solicitud con información del proyecto
    console.log('🔍 Buscando solicitud...');
    const solicitudResult = await db
      .select({
        id: projectParticipationRequests.id,
        userId: projectParticipationRequests.userId,
        projectId: projectParticipationRequests.projectId,
        requestType: projectParticipationRequests.requestType,
        status: projectParticipationRequests.status,
        projectUserId: projects.userId,
      })
      .from(projectParticipationRequests)
      .innerJoin(
        projects,
        eq(projectParticipationRequests.projectId, projects.id)
      )
      .where(eq(projectParticipationRequests.id, solicitudId))
      .limit(1);

    console.log('📋 Resultado de búsqueda:', solicitudResult);

    if (!solicitudResult.length) {
      console.error('❌ Solicitud no encontrada');
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    const solicitud = solicitudResult[0];
    console.log('✅ Solicitud encontrada:', solicitud);

    // Verificar permisos (solo el responsable del proyecto puede aprobar/rechazar)
    if (solicitud.projectUserId !== userId) {
      console.error(
        '❌ Sin permisos. Responsable del proyecto:',
        solicitud.projectUserId,
        'Usuario actual:',
        userId
      );
      return NextResponse.json(
        { error: 'No tienes permisos para procesar esta solicitud' },
        { status: 403 }
      );
    }

    if (solicitud.status !== 'pending') {
      console.error('❌ Solicitud ya procesada:', solicitud.status);
      return NextResponse.json(
        { error: 'La solicitud ya ha sido procesada' },
        { status: 400 }
      );
    }

    // Actualizar la solicitud
    console.log('📝 Actualizando solicitud...');
    const [updatedRequest] = await db
      .update(projectParticipationRequests)
      .set({
        status: status as 'approved' | 'rejected',
        responseMessage: responseMessage ?? null,
        respondedBy: userId,
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(projectParticipationRequests.id, solicitudId))
      .returning();

    console.log('✅ Solicitud actualizada:', updatedRequest);

    // Si se aprueba la solicitud, ejecutar la acción correspondiente
    if (status === 'approved') {
      console.log('✅ Solicitud aprobada, ejecutando acción...');

      if (solicitud.requestType === 'participation') {
        console.log('👤 Inscribiendo usuario en proyecto...');

        // Verificar si ya está inscrito para evitar duplicados
        const existingEnrollment = await db
          .select()
          .from(projectsTaken)
          .where(
            and(
              eq(projectsTaken.userId, solicitud.userId),
              eq(projectsTaken.projectId, solicitud.projectId)
            )
          )
          .limit(1);

        if (!existingEnrollment.length) {
          const [enrollment] = await db
            .insert(projectsTaken)
            .values({
              userId: solicitud.userId,
              projectId: solicitud.projectId,
              createdAt: new Date(),
            })
            .returning();

          console.log('✅ Usuario inscrito en proyecto:', enrollment);
        } else {
          console.log('ℹ️ Usuario ya estaba inscrito');
        }
      } else if (solicitud.requestType === 'resignation') {
        console.log('👤 Removiendo usuario del proyecto...');

        const deleteResult = await db
          .delete(projectsTaken)
          .where(
            and(
              eq(projectsTaken.userId, solicitud.userId),
              eq(projectsTaken.projectId, solicitud.projectId)
            )
          );

        console.log('✅ Usuario removido del proyecto:', deleteResult);
      }
    }

    const successMessage = `Solicitud de ${
      solicitud.requestType === 'participation' ? 'participación' : 'renuncia'
    } ${status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`;

    console.log('🎉 Proceso completado:', successMessage);

    return NextResponse.json({
      success: true,
      message: successMessage,
      request: updatedRequest,
    });
  } catch (error) {
    console.error('❌ === ERROR COMPLETO ===');
    console.error('Error type:', typeof error);
    console.error(
      'Error message:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    console.error('Full error object:', error);

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
