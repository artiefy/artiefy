import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and,eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectParticipationRequests,projects } from '~/server/db/schema';

export async function GET(request: NextRequest) {
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

    const projectIdNum = parseInt(projectId);
    if (isNaN(projectIdNum)) {
      return NextResponse.json(
        { error: 'projectId debe ser un número válido' },
        { status: 400 }
      );
    }

    // Verificar permisos del proyecto usando el esquema correcto
    const project = await db
      .select({ userId: projects.userId })
      .from(projects)
      .where(eq(projects.id, projectIdNum))
      .limit(1);

    if (!project.length) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    if (project[0].userId !== userId) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    // Contar solicitudes pendientes reales (ambos tipos)
    let count = 0;

    try {
      // Contar todas las solicitudes pendientes (participación y renuncia)
      const result = await db
        .select()
        .from(projectParticipationRequests)
        .where(
          and(
            eq(projectParticipationRequests.projectId, projectIdNum),
            eq(projectParticipationRequests.status, 'pending')
          )
        );

      count = result.length;
      console.log(
        `🔔 Proyecto ${projectId}: ${count} solicitudes pendientes (participación + renuncia)`
      );
    } catch (dbError) {
      console.error('Error consultando projectParticipationRequests:', dbError);
      count = 0;
    }

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error API solicitudes:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
