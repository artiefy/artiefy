/**
 * GET /api/embeddings/documents?courseId=xxx
 * Lista los documentos procesados de un curso
 *
 * Query:
 * - courseId: string (requerido)
 *
 * Response:
 * {
 *   documents: Array<{...}>,
 *   stats: {
 *     totalChunks: number,
 *     totalSources: number,
 *     lastUpdated: string
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';

import {
  getCourseDocuments,
  getEmbeddingsStats,
} from '~/lib/embeddings/search';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Se requiere parámetro: courseId' },
        { status: 400 }
      );
    }

    // Obtener documentos
    const documents = await getCourseDocuments(courseId);

    // Obtener estadísticas
    const stats = await getEmbeddingsStats(courseId);

    return NextResponse.json(
      {
        success: true,
        courseId,
        documents: documents.map((doc) => ({
          id: doc.id,
          source: doc.source,
          chunkIndex: doc.chunkIndex,
          contentPreview: doc.content.substring(0, 100) + '...',
          metadata: doc.metadata,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        })),
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en GET /api/embeddings/documents:', error);

    return NextResponse.json(
      {
        error: 'Error obteniendo documentos',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
