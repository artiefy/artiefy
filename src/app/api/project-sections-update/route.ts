import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectAddedSections, projects } from '~/server/db/schema';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error('❌ PUT: Usuario no autenticado');
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = (await request.json()) as {
      projectId: number;
      sectionId: string;
      sectionName: string;
      sectionContent: string;
    };
    const { projectId, sectionId, sectionName, sectionContent } = body;

    if (!projectId || !sectionId || !sectionName) {
      console.error('❌ PUT: Faltan parámetros');
      return Response.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario sea propietario del proyecto
    console.log(`📋 PUT: Verificando permisos para proyecto ${projectId}`);
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project.length) {
      console.error(`❌ PUT: Proyecto ${projectId} no encontrado`);
      return Response.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    if (project[0].userId !== userId) {
      console.error(`❌ PUT: Usuario no es propietario del proyecto`);
      return Response.json(
        { error: 'No tienes permiso para editar este proyecto' },
        { status: 403 }
      );
    }

    console.log(
      `📝 PUT: Editando sección ${sectionId} del proyecto ${projectId}`
    );

    // Actualizar la sección
    await db
      .update(projectAddedSections)
      .set({
        sectionName,
        sectionContent,
      })
      .where(
        and(
          eq(projectAddedSections.projectId, projectId),
          eq(projectAddedSections.sectionId, sectionId)
        )
      );

    console.log(`✅ PUT: Sección editada correctamente`);

    return Response.json(
      { success: true, message: 'Sección editada correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ PUT: Error al editar sección:', error);
    return Response.json(
      {
        error: `Error al editar la sección: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      },
      { status: 500 }
    );
  }
}
