import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectAddedSections, projects } from '~/server/db/schema';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error('❌ DELETE: Usuario no autenticado');
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = (await request.json()) as {
      projectId: number;
      sectionId: string;
    };
    const { projectId, sectionId } = body;

    if (!projectId || !sectionId) {
      console.error('❌ DELETE: Faltan parámetros');
      return Response.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario sea propietario del proyecto
    console.log(`📋 DELETE: Verificando permisos para proyecto ${projectId}`);
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project.length) {
      console.error(`❌ DELETE: Proyecto ${projectId} no encontrado`);
      return Response.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    if (project[0].userId !== userId) {
      console.error(`❌ DELETE: Usuario no es propietario del proyecto`);
      return Response.json(
        { error: 'No tienes permiso para editar este proyecto' },
        { status: 403 }
      );
    }

    console.log(
      `📝 DELETE: Eliminando sección ${sectionId} del proyecto ${projectId}`
    );

    // Eliminar la sección específica
    await db
      .delete(projectAddedSections)
      .where(
        and(
          eq(projectAddedSections.projectId, projectId),
          eq(projectAddedSections.sectionId, sectionId)
        )
      );

    console.log(`✅ DELETE: Sección eliminada correctamente`);

    return Response.json(
      { success: true, message: 'Sección eliminada correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ DELETE: Error al eliminar sección:', error);
    return Response.json(
      {
        error: `Error al eliminar la sección: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      },
      { status: 500 }
    );
  }
}
