import { NextResponse } from 'next/server';

import { eq, ilike, isNull, or, type SQL, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses, modalidades } from '~/server/db/schema';

interface RequestBody {
  query?: string;
  limit?: number;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';

function buildSearchPatterns(raw: string): string[] {
  const q = (raw ?? '').toLowerCase().trim();
  if (!q) return [];
  const words = q
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const patterns = new Set<string>();
  patterns.add(`%${q}%`);
  for (const w of words) {
    patterns.add(`%${w}%`);
    const endings = ['os', 'as', 'es', 'ia', 'a', 'o', 's'];
    for (const end of endings) {
      if (w.endsWith(end) && w.length - end.length >= 4) {
        patterns.add(`%${w.slice(0, -end.length)}%`);
      }
    }
    if (w.length > 6) patterns.add(`%${w.slice(0, 6)}%`);
    else if (w.length > 5) patterns.add(`%${w.slice(0, 5)}%`);
  }
  return Array.from(patterns).slice(0, 12);
}

async function searchWithEmbeddings(query: string, take: number) {
  if (!OPENAI_API_KEY) return [];
  const embRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: query.trim(),
      model: OPENAI_EMBEDDING_MODEL,
    }),
  });
  if (!embRes.ok) return [];

  const embData = (await embRes.json()) as {
    data?: { embedding?: number[] }[];
  };
  const embedding = embData?.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) return [];

  const vectorJson = JSON.stringify(embedding);
  const result = await db.execute(sql`
    SELECT
      c.id,
      c.title,
      c.description,
      c.modalidadesid AS "modalidadId",
      m.name AS "modalidadName",
      (1 - (c.embedding <=> ${vectorJson}::vector)) AS similarity
    FROM ${courses} c
    LEFT JOIN ${modalidades} m ON c.modalidadesid = m.id
    WHERE c.embedding IS NOT NULL
      AND (c.is_active = TRUE OR c.is_active IS NULL)
    ORDER BY similarity DESC
    LIMIT ${take}
  `);

  return (result.rows as Record<string, unknown>[]).map((row) => ({
    id: row.id as number,
    title: (row.title as string | null)?.trim() ?? '',
    description: (row.description as string | null)?.trim() ?? '',
    modalidad: (row.modalidadName as string | null)?.trim() ?? 'Sin modalidad',
    modalidadId: (row.modalidadId as number | null) ?? 1,
  }));
}

async function searchCourses(query: string | undefined, limit = 5) {
  const take = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 10) : 5;

  if (query?.trim()) {
    try {
      const byVector = await searchWithEmbeddings(query, take);
      if (byVector.length > 0) {
        return {
          courses: byVector,
          message: `Encontré ${byVector.length} cursos por similitud semántica.`,
        };
      }
    } catch (e) {
      console.warn('Embeddings search failed, falling back to ILIKE:', e);
    }
  }

  const patterns = buildSearchPatterns(query ?? '');
  if (patterns.length > 0) {
    const conditions: SQL[] = [];
    for (const p of patterns) {
      conditions.push(ilike(courses.title, p));
      conditions.push(ilike(courses.description, p));
    }

    const rows = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        modalidadId: courses.modalidadesid,
        modalidadName: modalidades.name,
      })
      .from(courses)
      .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
      .where(or(...conditions))
      .orderBy(sql`${courses.updatedAt} DESC`)
      .limit(take);

    const formattedFound = rows
      .filter((c) => typeof c.id === 'number' && typeof c.title === 'string')
      .map((c) => ({
        id: c.id,
        title: c.title?.trim() ?? '',
        description: c.description?.trim() ?? '',
        modalidad: c.modalidadName?.trim() ?? 'Sin modalidad',
        modalidadId: c.modalidadId ?? 1,
      }));

    if (formattedFound.length > 0) {
      return {
        courses: formattedFound,
        message: `Encontré ${formattedFound.length} cursos relacionados con "${query}".`,
      };
    }
  }

  const fallback = await db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      modalidadId: courses.modalidadesid,
      modalidadName: modalidades.name,
    })
    .from(courses)
    .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
    .where(or(eq(courses.isActive, true), isNull(courses.isActive)))
    .orderBy(sql`${courses.updatedAt} DESC`)
    .limit(take);

  const formattedFallback = fallback
    .filter((c) => typeof c.id === 'number' && typeof c.title === 'string')
    .map((c) => ({
      id: c.id,
      title: c.title?.trim() ?? '',
      description: c.description?.trim() ?? '',
      modalidad: c.modalidadName?.trim() ?? 'Sin modalidad',
      modalidadId: c.modalidadId ?? 1,
    }));

  const message =
    formattedFallback.length > 0
      ? `Sin coincidencias exactas para "${query}". Mostrando ${formattedFallback.length} cursos disponibles.`
      : `No encontré cursos relacionados con "${query}".`;

  return { courses: formattedFallback, message };
}

export async function POST(req: Request) {
  try {
    const { query, limit = 5 }: RequestBody = await req.json();
    const result = await searchCourses(query, limit);
    return NextResponse.json({ ...result, query });
  } catch (error) {
    console.error('Error searching courses:', error);
    return NextResponse.json(
      { error: 'Error searching courses', courses: [] },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query =
      url.searchParams.get('query') ?? url.searchParams.get('q') ?? '';
    const limit = Number(url.searchParams.get('limit') ?? '5');
    const result = await searchCourses(query, limit);
    return NextResponse.json({ ...result, query });
  } catch (error) {
    console.error('Error searching courses (GET):', error);
    return NextResponse.json(
      { error: 'Error searching courses', courses: [] },
      { status: 500 }
    );
  }
}
