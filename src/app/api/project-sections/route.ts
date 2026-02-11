import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectAddedSections } from '~/server/db/schema';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return Response.json(
        { error: 'projectId es requerido' },
        { status: 400 }
      );
    }

    const pid = Number(projectId);
    console.log(
      `📂 GET /api/project-sections: Buscando secciones de proyecto ${pid}`
    );

    const sections = await db
      .select()
      .from(projectAddedSections)
      .where(eq(projectAddedSections.projectId, pid));

    console.log(
      `✅ GET /api/project-sections: Se encontraron ${sections.length} secciones`
    );

    if (sections.length > 0) {
      console.log(
        `📄 Secciones encontradas:`,
        sections.map((s) => `${s.sectionId} - ${s.sectionName}`)
      );
    }

    // Transformar respuesta
    const result: Record<string, { name: string; content: string }> = {};
    for (const section of sections) {
      result[section.sectionId] = {
        name: section.sectionName,
        content: section.sectionContent,
      };
    }

    return Response.json(result);
  } catch (error) {
    console.error('❌ GET /api/project-sections Error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
