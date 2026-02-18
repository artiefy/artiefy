'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectAddedSections } from '~/server/db/schema';

interface Section {
  name: string;
  content: string;
}

export async function loadProjectSections(
  projectId: number
): Promise<Record<string, Section>> {
  try {
    console.log(`📂 Cargando secciones para proyecto ${projectId}`);

    const sections = await db
      .select()
      .from(projectAddedSections)
      .where(eq(projectAddedSections.projectId, projectId));

    console.log(`✅ Se encontraron ${sections.length} secciones`);

    const result: Record<string, Section> = {};

    for (const section of sections) {
      console.log(`📄 Sección: ${section.sectionId} - ${section.sectionName}`);
      result[section.sectionId] = {
        name: section.sectionName,
        content: section.sectionContent,
      };
    }

    return result;
  } catch (error) {
    console.error('❌ Error al cargar secciones:', error);
    return {};
  }
}
