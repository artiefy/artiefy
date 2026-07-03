import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectAddedSections, projects } from '~/server/db/schema';

export async function GET(request: Request) {
  // Security best practice: dev-only debug endpoint; never reachable in prod.
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener el projectId de los params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return Response.json({ error: 'projectId requerido' }, { status: 400 });
    }

    const pid = Number(projectId);

    // Test 1: Verificar que el proyecto existe
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, pid))
      .limit(1);

    if (!project.length) {
      return Response.json(
        { error: `Proyecto ${pid} no encontrado` },
        { status: 404 }
      );
    }

    // Test 2: Verificar permisos
    if (project[0].userId !== user.id) {
      return Response.json(
        { error: 'No tienes permiso para este proyecto' },
        { status: 403 }
      );
    }

    // Test 3: Intentar insertar una sección de prueba
    const testSectionId = `test-${Date.now()}`;

    await db.insert(projectAddedSections).values({
      projectId: pid,
      sectionId: testSectionId,
      sectionName: 'Sección de Prueba',
      sectionContent: 'Contenido de prueba',
      isCustom: false,
      displayOrder: 0,
    });

    // Test 4: Verificar que se insertó
    const inserted = await db
      .select()
      .from(projectAddedSections)
      .where(eq(projectAddedSections.projectId, pid));

    // Test 5: Limpiar (eliminar la sección de prueba)
    await db
      .delete(projectAddedSections)
      .where(eq(projectAddedSections.sectionId, testSectionId));

    return Response.json({
      success: true,
      projectName: project[0].name,
      tests: {
        projectFound: true,
        permissionsOk: true,
        insertWorks: true,
        selectWorks: inserted.length > 0,
      },
      sectionsCount: inserted.length,
    });
  } catch {
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
