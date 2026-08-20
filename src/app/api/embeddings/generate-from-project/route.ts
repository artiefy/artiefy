/**
 * POST /api/embeddings/generate-from-project
 * Genera embeddings de un proyecto guiado completo: el proyecto, sus
 * objetivos y las actividades de cada objetivo.
 *
 * Es el equivalente de `generate-from-course` pero para `guided_projects`.
 *
 * Body:
 *   { projectId: number }
 */

import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { getGuidedProjectContentForEmbeddings } from '~/lib/embeddings/guided-project-processor';
import { getDocumentStats, processDocument } from '~/lib/embeddings/processor';
import { saveDocumentEmbeddings } from '~/lib/embeddings/search';

export const maxDuration = 300;

export async function POST(request: Request) {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;
  if (!userId || (role !== 'admin' && role !== 'super-admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      projectId?: number;
    };

    const { projectId } = body;

    if (!projectId || isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Se requiere projectId (número válido)' },
        { status: 400 }
      );
    }

    console.log(`🚀 Generando embeddings del proyecto guiado ${projectId}`);

    const projectData = await getGuidedProjectContentForEmbeddings(projectId);

    console.log(`📊 Contenido total: ${projectData.totalTokens} tokens`);

    const maxTokens = 100_000;
    if (projectData.totalTokens > maxTokens) {
      return NextResponse.json(
        {
          error: `Proyecto muy grande (${projectData.totalTokens} tokens). Máximo ${maxTokens}`,
          tokens: projectData.totalTokens,
          maxTokens,
        },
        { status: 413 }
      );
    }

    if (projectData.totalTokens === 0) {
      return NextResponse.json(
        { error: 'El proyecto no tiene contenido textual para indexar' },
        { status: 422 }
      );
    }

    const documents = await processDocument(
      projectData.projectContent,
      `Proyecto-${projectData.projectTitle}`,
      1000,
      200
    );

    const stats = getDocumentStats(documents);
    console.log(
      `✅ ${stats.totalChunks} chunks - Costo estimado: $${stats.estimatedCost}`
    );

    const saved = await saveDocumentEmbeddings(
      { type: 'project', id: projectId },
      documents
    );
    console.log(`✅ Guardados ${saved} documentos en BD`);

    return NextResponse.json(
      {
        success: true,
        message: `Embeddings generados para el proyecto ${projectData.projectTitle}`,
        projectId,
        projectTitle: projectData.projectTitle,
        stats: {
          ...stats,
          projectId,
          totalObjectives: projectData.sources.filter(
            (s) => s.type === 'objective'
          ).length,
          totalActivities: projectData.sources.filter(
            (s) => s.type === 'activity'
          ).length,
          sources: projectData.sources,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      '❌ Error en POST /api/embeddings/generate-from-project:',
      error
    );

    return NextResponse.json(
      {
        error: 'Error procesando el proyecto',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
