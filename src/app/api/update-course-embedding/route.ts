import { NextRequest, NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface OpenAIEmbeddingResponse {
  data: { embedding: number[] }[];
}

interface RequestBody {
  courseId: number;
  text: string;
}

export async function POST(req: NextRequest) {
  try {
    const { courseId, text }: RequestBody = await req.json();

    // 1. Generar el embedding usando OpenAI
    const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002',
      }),
    });

    const embeddingData: OpenAIEmbeddingResponse = await embeddingRes.json();
    const embedding = embeddingData?.data?.[0]?.embedding;

    if (!embedding) {
      return NextResponse.json(
        { error: 'No se pudo generar el embedding' },
        { status: 500 }
      );
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
