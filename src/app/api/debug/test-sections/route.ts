import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectAddedSections, projects } from '~/server/db/schema';

export async function GET(request: Request) {
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

    console.log(`✅ Proyecto encontrado:`, project[0].name);

    // Test 2: Verificar permisos
    if (project[0].userId !== user.id) {
      return Response.json(
        { error: 'No tienes permiso para este proyecto' },
        { status: 403 }
      );
    }

    console.log(`✅ Permiso verificado para usuario ${user.id}`);

    // Test 3: Intentar insertar una sección de prueba
    const testSectionId = `test-${Date.now()}`;
    console.log(`📝 Intentando insertar sección de prueba: ${testSectionId}`);

    await db.insert(projectAddedSections).values({
      projectId: pid,
      sectionId: testSectionId,
      sectionName: 'Sección de Prueba',
      sectionContent: 'Contenido de prueba',
      isCustom: false,
      displayOrder: 0,
    });

    console.log(`✅ Sección de prueba insertada correctamente`);

    // Test 4: Verificar que se insertó
    const inserted = await db
      .select()
      .from(projectAddedSections)
      .where(eq(projectAddedSections.projectId, pid));

    console.log(`✅ Secciones encontradas para proyecto ${pid}:`, inserted);

    // Test 5: Limpiar (eliminar la sección de prueba)
    await db
      .delete(projectAddedSections)
      .where(eq(projectAddedSections.sectionId, testSectionId));

    console.log(`✅ Sección de prueba eliminada`);

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
  } catch (error) {
    console.error('❌ Error en test:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Error desconocido',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
