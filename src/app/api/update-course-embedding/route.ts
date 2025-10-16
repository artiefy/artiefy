import { NextRequest, NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small'; // <-- cambiado || por ??

interface OpenAIEmbeddingResponse {
  data: { embedding: number[] }[];
}

interface RequestBody {
  courseId: number;
  text: string;
}

export async function POST(req: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY no configurada' },
        { status: 400 }
      );
    }

    const { courseId, text }: RequestBody = await req.json();
    if (!courseId || !text?.trim()) {
      return NextResponse.json(
        { error: 'courseId y text son requeridos' },
        { status: 400 }
      );
    }

    // 1. Generar el embedding usando OpenAI (modelo desde .env)
    const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        model: OPENAI_EMBEDDING_MODEL,
      }),
    });

    if (!embeddingRes.ok) {
      const errText = await embeddingRes.text().catch(() => '');
      return NextResponse.json(
        { error: 'No se pudo generar el embedding', details: errText },
        { status: 500 }
      );
    }

    const embeddingData: OpenAIEmbeddingResponse = await embeddingRes.json();
    const embedding = embeddingData?.data?.[0]?.embedding;

    if (!embedding) {
      return NextResponse.json({ error: 'Embedding vacío' }, { status: 500 });
    }

    // 2. Guardar el embedding en la base de datos
    await db.update(courses).set({ embedding }).where(eq(courses.id, courseId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error actualizando el embedding:', err);
    return NextResponse.json(
      { error: 'Error actualizando el embedding' },
      { status: 500 }
    );
  }
}
