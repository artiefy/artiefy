import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectAddedSections, projects } from '~/server/db/schema';

interface Section {
  name: string;
  content: string;
}

interface SaveSectionsRequest {
  projectId: number;
  sections: Record<string, Section>;
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      console.error('❌ POST /api/project-sections: Usuario no autenticado');
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { projectId, sections } =
      (await request.json()) as SaveSectionsRequest;
    console.log(
      `📝 POST /api/project-sections: Guardando ${Object.keys(sections).length} secciones para proyecto ${projectId}`
    );

    // Verificar que el usuario sea el propietario del proyecto
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project.length) {
      console.error(`❌ POST: Proyecto ${projectId} no encontrado`);
      return Response.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    if (project[0].userId !== user.id) {
      console.error(
        `❌ POST: Usuario ${user.id} no es propietario del proyecto ${projectId}`
      );
      return Response.json(
        { error: 'No tienes permiso para editar este proyecto' },
        { status: 403 }
      );
    }

    console.log(`✅ POST: Permisos verificados. Guardando secciones...`);

    // Eliminar secciones antiguas
    await db
      .delete(projectAddedSections)
      .where(eq(projectAddedSections.projectId, projectId));
    console.log(`✅ POST: Secciones antiguas eliminadas`);

    // Insertar nuevas secciones
    for (const [sectionId, section] of Object.entries(sections)) {
      console.log(
        `📝 POST: Insertando sección: ${sectionId} - ${section.name}`
      );
      await db.insert(projectAddedSections).values({
        projectId,
        sectionId,
        sectionName: section.name,
        sectionContent: section.content,
        isCustom: sectionId.startsWith('custom-'),
        displayOrder: 0,
      });
    }

    console.log(
      `✅ POST: ${Object.keys(sections).length} secciones guardadas correctamente`
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error('❌ POST /api/project-sections Error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
