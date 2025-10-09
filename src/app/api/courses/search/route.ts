import { NextRequest, NextResponse } from 'next/server';

import { sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-ada-002';

interface OpenAIEmbeddingResponse {
  data: { embedding: number[] }[];
}

// NUEVO: Definir tipo para el resultado de la consulta SQL
interface CourseSearchResult {
  id: number;
  title: string;
  description: string;
  distance: number;
}

export async function POST(req: NextRequest) {
  try {
    const { query, limit = 5 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log('🔍 Búsqueda de cursos con embeddings:', { query, limit });

    if (!OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY no configurada, usando búsqueda básica');
      return NextResponse.json({ courses: [] });
    }

    // 1. Generar embedding para la consulta
    const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: query,
        model: OPENAI_EMBEDDING_MODEL,
      }),
    });

    if (!embeddingRes.ok) {
      console.error('❌ Error generando embedding:', await embeddingRes.text());
      return NextResponse.json({ courses: [] });
    }

    const embeddingData: OpenAIEmbeddingResponse = await embeddingRes.json();
    const queryEmbedding = embeddingData?.data?.[0]?.embedding;

    if (!queryEmbedding) {
      console.error('❌ No se pudo generar embedding');
      return NextResponse.json({ courses: [] });
    }

    // 2. Buscar cursos similares usando pgvector - CORREGIDO: acceder a rows
    const result = await db.execute(
      sql`
        SELECT 
          id, 
          title, 
          description,
          (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as distance
        FROM ${courses} 
        WHERE embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT ${limit}
      `
    );

    // CORREGIDO: Convertir primero a unknown y luego validar cada elemento
    const rawRows = result.rows as unknown;
    const similarCourses: CourseSearchResult[] = [];

    if (Array.isArray(rawRows)) {
      rawRows.forEach((row) => {
        if (
          row &&
          typeof row === 'object' &&
          'id' in row &&
          'title' in row &&
          'description' in row &&
          'distance' in row
        ) {
          const typedRow = row as Record<string, unknown>;

          // FIX: Validación segura de description antes de usarla
          let safeDescription = '';
          const desc = typedRow.description;

          if (typeof desc === 'string') {
            safeDescription = desc;
          } else if (desc === null || desc === undefined) {
            safeDescription = '';
          } else if (typeof desc === 'number') {
            safeDescription = String(desc);
          } else {
            // Para cualquier otro tipo (objeto, array, etc.), usar string vacío para evitar [object Object]
            safeDescription = '';
          }

          similarCourses.push({
            id: Number(typedRow.id),
            title: String(typedRow.title),
            description: safeDescription,
            distance: Number(typedRow.distance),
          });
        }
      });
    }

    console.log('📚 Cursos encontrados:', similarCourses.length);

    // CORREGIDO: Ya no necesitamos mapear porque ya están tipados
    const formattedCourses = similarCourses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      distance: course.distance,
    }));

    return NextResponse.json({
      courses: formattedCourses,
      query,
      method: 'embeddings',
    });
  } catch (error) {
    console.error('💥 Error en búsqueda de cursos:', error);
    return NextResponse.json({ courses: [] });
  }
}
