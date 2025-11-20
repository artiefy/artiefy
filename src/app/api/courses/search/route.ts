// src/app/api/courses/search/route.ts
import { NextRequest } from 'next/server';

// No se usan directamente, solo en la consulta SQL
import { sql } from 'drizzle-orm';

import { env } from '~/env';
import { db } from '~/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getEmbedding(input: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ input, model: 'text-embedding-3-small' }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`OpenAI error: ${res.status} ${txt}`);
  }
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  const emb = json?.data?.[0]?.embedding;
  if (!Array.isArray(emb)) throw new Error('Embedding vacío');
  return emb;
}

export async function POST(req: NextRequest) {
  try {
    const { query, limit } = (await req.json()) as {
      query?: string;
      limit?: number;
    };

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'query requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const topK =
      Number.isFinite(limit) && typeof limit === 'number' && limit > 0
        ? Math.min(Number(limit), 10)
        : 5;

    const qEmbedding = await getEmbedding(query);

    // Construimos el literal vector de forma segura
    const vectorLiteral = sql.raw(`'[${qEmbedding.join(',')}]'::vector`);

    // Usamos consulta SQL cruda para ordenar por distancia de vector (cosine <=>)
    const result = await db.execute<Record<string, unknown>>(sql`
      SELECT
        c.id,
        c.title,
        c.modalidadesid AS "modalidadId",
        m.name AS modalidad,
        (c.embedding <=> ${vectorLiteral}) AS distance
      FROM courses c
      LEFT JOIN modalidades m ON m.id = c.modalidadesid
      WHERE c.embedding IS NOT NULL AND c.is_active = true
      ORDER BY c.embedding <=> ${vectorLiteral}
      LIMIT ${topK}
    `);

    const rows = (result.rows ?? []) as Record<string, unknown>[];
    const coursesOut = rows.map((r) => ({
      id: typeof r.id === 'number' ? r.id : Number(r.id),
      title:
        typeof r.title === 'string'
          ? r.title
          : r.title === undefined || r.title === null
            ? ''
            : null,
      modalidad:
        typeof r.modalidad === 'string' ? r.modalidad : (r.modalidad ?? null),
      modalidadId:
        typeof r.modalidadId === 'number'
          ? r.modalidadId
          : r.modalidadId !== undefined
            ? Number(r.modalidadId)
            : null,
    }));

    return new Response(JSON.stringify({ courses: coursesOut }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'error_desconocido',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
