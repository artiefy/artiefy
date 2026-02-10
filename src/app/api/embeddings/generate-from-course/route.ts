/**
 * POST /api/embeddings/generate-from-course
 * Genera embeddings para un curso COMPLETO (con todos sus archivos)
 *
 * Body:
 * {
 *   courseId: number
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   courseId: number,
 *   courseTitle: string,
 *   stats: {
 *     totalChunks: number,
 *     totalTokens: number,
 *     avgChunkTokens: number,
 *     estimatedCost: string,
 *     costInCents: number,
 *     courseId: number,
 *     totalFiles: number,
 *     totalLessons: number,
 *     totalActivities: number,
 *     sources: Array
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';

import { getCourseContentForEmbeddings } from '~/lib/embeddings/course-processor';
import { getDocumentStats, processDocument } from '~/lib/embeddings/processor';
import { saveDocumentEmbeddings } from '~/lib/embeddings/search';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      courseId?: number;
    };

    const { courseId } = body;

    if (!courseId || isNaN(courseId)) {
      return NextResponse.json(
        { error: 'Se requiere courseId (número válido)' },
        { status: 400 }
      );
    }

    console.log(`🚀 Iniciando generación de embeddings para curso ${courseId}`);

    // Obtener todo el contenido del curso
    const courseData = await getCourseContentForEmbeddings(courseId);

    console.log(`📊 Contenido total: ${courseData.totalTokens} tokens`);

    const maxTokens = 100_000;
    if (courseData.totalTokens > maxTokens) {
      return NextResponse.json(
        {
          error: `Curso muy grande (${courseData.totalTokens} tokens). Máximo ${maxTokens} tokens`,
          tokens: courseData.totalTokens,
          maxTokens,
        },
        { status: 413 }
      );
    }

    // Procesar el contenido
    console.log(`⚙️ Procesando documentos...`);
    const documents = await processDocument(
      courseData.courseContent,
      `Curso-${courseData.courseTitle}`,
      1000,
      200
    );

    // Obtener estadísticas
    const stats = getDocumentStats(documents);
    console.log(
      `✅ Procesados ${stats.totalChunks} chunks - Costo estimado: $${stats.estimatedCost}`
    );

    // Guardar en base de datos
    console.log(`💾 Guardando embeddings en BD...`);
    const saved = await saveDocumentEmbeddings(String(courseId), documents);
    console.log(`✅ Guardados ${saved} documentos en BD`);

    return NextResponse.json(
      {
        success: true,
        message: `Embeddings generados para curso ${courseData.courseTitle}`,
        courseId,
        courseTitle: courseData.courseTitle,
        stats: {
          ...stats,
          courseId,
          totalFiles: courseData.sources.filter((s) => s.type === 'file')
            .length,
          totalLessons: courseData.sources.filter((s) => s.type === 'lesson')
            .length,
          totalActivities: courseData.sources.filter(
            (s) => s.type === 'activity'
          ).length,
          sources: courseData.sources,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      '❌ Error en POST /api/embeddings/generate-from-course:',
      error
    );

    return NextResponse.json(
      {
        error: 'Error procesando curso',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
