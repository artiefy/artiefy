'use server';

import { revalidatePath } from 'next/cache';

import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectAddedSections, projects } from '~/server/db/schema';

interface Section {
  name: string;
  content: string;
}

interface SaveProjectSectionsData {
  projectId: number;
  sections: Record<string, Section>;
}

export async function saveProjectSections({
  projectId,
  sections,
}: SaveProjectSectionsData): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await currentUser();
    if (!user) {
      console.error('❌ Usuario no autenticado');
      return { success: false, error: 'No autorizado' };
    }

    // Verificar que el usuario sea el propietario del proyecto
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project.length) {
      console.error(`❌ Proyecto ${projectId} no encontrado`);
      return {
        success: false,
        error: 'Proyecto no encontrado',
      };
    }

    if (project[0].userId !== user.id) {
      console.error(
        `❌ Usuario ${user.id} no es propietario del proyecto ${projectId}`
      );
      return {
        success: false,
        error: 'No tienes permiso para editar este proyecto',
      };
    }

    console.log(
      `✅ Guardando ${Object.keys(sections).length} secciones para proyecto ${projectId}`
    );

    // Eliminar secciones antiguas
    await db
      .delete(projectAddedSections)
      .where(eq(projectAddedSections.projectId, projectId));

    // Insertar nuevas secciones
    for (const [sectionId, section] of Object.entries(sections)) {
      console.log(`📝 Insertando sección: ${sectionId} - ${section.name}`);
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
      `✅ Secciones guardadas correctamente para proyecto ${projectId}`
    );

    // Revalidar la ruta de proyectos
    revalidatePath('/estudiantes/projects');
    revalidatePath(`/estudiantes/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error('❌ Error al guardar secciones:', error);
    return {
      success: false,
      error: `Error al guardar las secciones: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    };
  }
}
