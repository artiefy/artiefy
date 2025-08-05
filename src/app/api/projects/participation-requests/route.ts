import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import {
  projectParticipationRequests,
  projectsTaken,
  users,
} from '~/server/db/schema';
import { auth } from '@clerk/nextjs/server';

// Crear solicitud de participación
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, requestMessage, requestType = 'participation' } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId es requerido' },
        { status: 400 }
      );
    }

    // Validar que el tipo de solicitud sea válido
    if (!['participation', 'resignation'].includes(requestType)) {
      return NextResponse.json(
        { error: 'Tipo de solicitud inválido' },
        { status: 400 }
      );
    }

    // Para solicitudes de renuncia, verificar que el usuario esté inscrito
    if (requestType === 'resignation') {
      const existingEnrollment = await db
        .select()
        .from(projectsTaken)
        .where(
          and(
            eq(projectsTaken.userId, userId),
            eq(projectsTaken.projectId, projectId)
          )
        )
        .limit(1);

      if (!existingEnrollment.length) {
        return NextResponse.json(
          { error: 'No estás inscrito en este proyecto' },
          { status: 400 }
        );
      }
    } else {
      // Para solicitudes de participación, verificar que no esté ya inscrito
      const existingEnrollment = await db
        .select()
        .from(projectsTaken)
        .where(
          and(
            eq(projectsTaken.userId, userId),
            eq(projectsTaken.projectId, projectId)
          )
        )
        .limit(1);

      if (existingEnrollment.length > 0) {
        return NextResponse.json(
          { error: 'Ya estás inscrito en este proyecto' },
          { status: 400 }
        );
      }
    }

    // Verificar si ya existe una solicitud pendiente del mismo tipo
    const existingRequest = await db
      .select()
      .from(projectParticipationRequests)
      .where(
        and(
          eq(projectParticipationRequests.userId, userId),
          eq(projectParticipationRequests.projectId, projectId),
          eq(projectParticipationRequests.requestType, requestType),
          eq(projectParticipationRequests.status, 'pending')
        )
      )
      .limit(1);

    if (existingRequest.length > 0) {
      const messageType =
        requestType === 'participation' ? 'participación' : 'renuncia';
      return NextResponse.json(
        { error: `Ya tienes una solicitud de ${messageType} pendiente` },
        { status: 400 }
      );
    }

    // Crear la nueva solicitud
    const [newRequest] = await db
      .insert(projectParticipationRequests)
      .values({
        userId,
        projectId,
        requestType,
        requestMessage,
        status: 'pending',
      })
      .returning();

    return NextResponse.json(newRequest);
  } catch (error) {
    console.error('Error creando solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Obtener solicitudes de un proyecto
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const checkUserId = searchParams.get('userId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId es requerido' },
        { status: 400 }
      );
    }

    // Si se proporciona userId, verificar solicitud específica
    if (checkUserId) {
      const userRequest = await db
        .select({
          id: projectParticipationRequests.id,
          userId: projectParticipationRequests.userId,
          projectId: projectParticipationRequests.projectId,
          requestType: projectParticipationRequests.requestType,
          status: projectParticipationRequests.status,
          requestMessage: projectParticipationRequests.requestMessage,
          createdAt: projectParticipationRequests.createdAt,
        })
        .from(projectParticipationRequests)
        .where(
          and(
            eq(projectParticipationRequests.userId, checkUserId),
            eq(projectParticipationRequests.projectId, parseInt(projectId)),
            eq(projectParticipationRequests.status, 'pending')
          )
        )
        .limit(1);

      if (userRequest.length === 0) {
        return NextResponse.json(null, { status: 404 });
      }

      return NextResponse.json(userRequest[0]);
    }

    // Obtener todas las solicitudes del proyecto con información del usuario
    const requests = await db
      .select({
        id: projectParticipationRequests.id,
        userId: projectParticipationRequests.userId,
        projectId: projectParticipationRequests.projectId,
        requestType: projectParticipationRequests.requestType,
        status: projectParticipationRequests.status,
        requestMessage: projectParticipationRequests.requestMessage,
        responseMessage: projectParticipationRequests.responseMessage,
        createdAt: projectParticipationRequests.createdAt,
        updatedAt: projectParticipationRequests.updatedAt,
        respondedAt: projectParticipationRequests.respondedAt,
        respondedBy: projectParticipationRequests.respondedBy,
        userName: users.name,
        userEmail: users.email,
      })
      .from(projectParticipationRequests)
      .innerJoin(users, eq(projectParticipationRequests.userId, users.id))
      .where(eq(projectParticipationRequests.projectId, parseInt(projectId)))
      .orderBy(projectParticipationRequests.createdAt);

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Eliminar todas las solicitudes de un proyecto
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId es requerido' },
        { status: 400 }
      );
    }

    // Eliminar todas las solicitudes del proyecto
    const deletedRequests = await db
      .delete(projectParticipationRequests)
      .where(eq(projectParticipationRequests.projectId, parseInt(projectId)))
      .returning();

    return NextResponse.json({
      message: `${deletedRequests.length} solicitudes eliminadas exitosamente`,
      deletedCount: deletedRequests.length,
      deletedRequests,
    });
  } catch (error) {
    console.error('Error eliminando solicitudes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
