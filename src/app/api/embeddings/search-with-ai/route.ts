import { NextRequest, NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';
import { OpenAI } from 'openai';

import { env } from '~/env';
import {
  cosineSimilarity,
  generateEmbedding,
} from '~/lib/embeddings/processor';
import { db } from '~/server/db';
import { documentEmbeddings } from '~/server/db/schema';

type SearchParams = {
  courseId?: number;
  query?: string;
  topK?: number;
  threshold?: number;
};

/**
 * POST /api/embeddings/search-with-ai
 * Busca embeddings y procesa la respuesta con IA para hacerla conversacional
 * Ejemplo: Si preguntas "nombre del curso", devuelve "Claro que sí, el curso se llama..."
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SearchParams;
    const { courseId, query, topK = 3, threshold = 0.3 } = body;

    // Validación
    if (!courseId || !query) {
      return NextResponse.json(
        {
          success: false,
          error: 'courseId y query son requeridos',
        },
        { status: 400 }
      );
    }

    // 1. Generar embedding de la pregunta
    const queryEmbedding = await generateEmbedding(query.trim());

    // 2. Buscar documentos similares en la base de datos
    const allResults = await db
      .selectDistinct()
      .from(documentEmbeddings)
      .where(eq(documentEmbeddings.courseId, courseId))
      .then((rows) =>
        rows
          .map((row) => {
            const embedding = row.embedding as unknown as number[];
            const similarity = cosineSimilarity(queryEmbedding, embedding);
            return {
              id: row.id,
              content: row.content,
              similarity,
              source: row.source || '',
              metadata: row.metadata as Record<string, unknown> | null,
              chunkIndex: row.chunkIndex || 0,
            };
          })
          .filter((r) => r.similarity >= threshold)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, topK)
      );

    // 3. Si no hay resultados, retornar error gracefully
    if (allResults.length === 0) {
      return NextResponse.json({
        success: true,
        response:
          '🤔 No encontré información sobre eso en el curso. Intenta preguntar algo diferente.',
        results: [],
        count: 0,
      });
    }

    // 4. Procesar con IA para hacer la respuesta conversacional
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    const contextText = allResults
      .map((r) => `[${r.source}]\n${r.content}`)
      .join('\n\n---\n\n');

    const systemPrompt = `Eres un asistente educativo amigable y conversacional. 
Responde las preguntas de los estudiantes sobre el curso de forma clara, directa y natural.

IMPORTANTE:
- Si la pregunta es simple (como "¿nombre del curso?"), responde de forma conversacional simple sin listar formatos.
- Si la pregunta pide información técnica o detalhada, proporciona los detalles relevantes.
- Usa un tono amigable y accesible.
- Evita reproducir exactamente el contenido bruto - parafrasea y simplifica.
- Si el contenido tiene formato especial (--- Hoja: X ---), interpreta y resume.
- NUNCA incluyas IDs técnicos, nombres de usuarios, o metadata innecesaria.
- Mantén la respuesta concisa (máximo 3-4 oraciones para preguntas simples, máximo 1 párrafo más puntos para temas complejos).

Contexto del curso:
${contextText}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = (completion.choices[0]?.message?.content || '').trim();

    return NextResponse.json({
      success: true,
      response: aiResponse || 'No pude procesar tu pregunta. Intenta de nuevo.',
      results: allResults,
      count: allResults.length,
      rawQuery: query,
    });
  } catch (error) {
    console.error('Error en search-with-ai:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error desconocido en la búsqueda',
      },
      { status: 500 }
    );
  }
}
