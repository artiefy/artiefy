import { NextRequest, NextResponse } from 'next/server';

import { generateQueryEmbedding } from '~/lib/embeddings/processor';
import { searchDocumentEmbeddings } from '~/lib/embeddings/search';

export async function POST(request: NextRequest) {
  try {
    const { courseId, query, topK = 5, threshold = 0.5 } = await request.json();

    // Validaciones
    if (!courseId || !query) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: courseId, query' },
        { status: 400 }
      );
    }

    if (typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'La query debe ser un string no vacío' },
        { status: 400 }
      );
    }

    // Generar embedding para la query
    console.log(`🔍 Buscando: "${query}"`);
    const queryEmbedding = await generateQueryEmbedding(query);

    // Buscar documentos similares (asegurarse que courseId es número)
    const courseIdNum =
      typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;
    if (isNaN(courseIdNum)) {
      return NextResponse.json(
        { error: 'courseId debe ser un número válido' },
        { status: 400 }
      );
    }

    const results = await searchDocumentEmbeddings(
      courseIdNum,
      queryEmbedding,
      topK,
      threshold
    );

    console.log(`✅ Encontrados ${results.length} resultados relevantes`);

    return NextResponse.json(
      {
        success: true,
        query,
        results,
        count: results.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en POST /api/embeddings/search:', error);

    return NextResponse.json(
      {
        error: 'Error buscando documentos',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
