/**
 * POST /api/embeddings/generate
 * Genera embeddings para un documento
 *
 * Body:
 * {
 *   courseId: string
 *   fileName: string
 *   content: string (texto extraído del documento)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';

import { getDocumentStats, processDocument } from '~/lib/embeddings/processor';
import { saveDocumentEmbeddings } from '~/lib/embeddings/search';
import { estimateTokens } from '~/lib/embeddings/utils';

export async function POST(request: NextRequest) {
  try {
    const { courseId, fileName, content } = await request.json();

    // Validaciones
    if (!courseId || !fileName || !content) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: courseId, fileName, content' },
        { status: 400 }
      );
    }

    if (typeof content !== 'string' || content.length === 0) {
      return NextResponse.json(
        { error: 'El contenido debe ser un string no vacío' },
        { status: 400 }
      );
    }

    // Validar tamaño
    const tokens = estimateTokens(content);
    const maxTokens = 100_000; // Límite de ~33 páginas

    if (tokens > maxTokens) {
      return NextResponse.json(
        {
          error: `Documento muy largo (${tokens} tokens). Máximo ${maxTokens} tokens`,
          tokens,
          maxTokens,
        },
        { status: 413 }
      );
    }

    console.log(`📄 Procesando documento: ${fileName}`);
    console.log(`📊 Tokens estimados: ${tokens}`);

    // Procesar documento y generar embeddings
    const documents = await processDocument(content, fileName, 1000, 200);

    // Obtener estadísticas
    const stats = getDocumentStats(documents);
    console.log(
      `✅ Procesados ${stats.totalChunks} chunks - Costo estimado: $${stats.estimatedCost}`
    );

    // Guardar en base de datos
    const saved = await saveDocumentEmbeddings(courseId, documents);
    console.log(`💾 Guardados ${saved} documentos en BD`);

    return NextResponse.json(
      {
        success: true,
        message: `Documento procesado exitosamente`,
        stats: {
          ...stats,
          courseId,
          fileName,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en POST /api/embeddings/generate:', error);

    return NextResponse.json(
      {
        error: 'Error procesando documento',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
