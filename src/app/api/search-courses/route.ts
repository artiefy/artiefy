import { NextResponse } from 'next/server';

import { sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

export async function POST(req: Request) {
  try {
    // Parsear y tipar el body de forma segura para evitar `any`
    const rawBody = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    // Validaciones de tipo explícitas
    const prompt =
      typeof rawBody.prompt === 'string' ? rawBody.prompt.trim() : '';

    let limit = 5;
    if (typeof rawBody.limit === 'number' && Number.isFinite(rawBody.limit)) {
      limit = Math.min(Math.max(Math.trunc(rawBody.limit), 1), 5);
    } else if (
      typeof rawBody.limit === 'string' &&
      rawBody.limit.trim() !== ''
    ) {
      const parsed = Number.parseInt(rawBody.limit, 10);
      if (!Number.isNaN(parsed)) {
        limit = Math.min(Math.max(parsed, 1), 5);
      }
    }

    if (!prompt) {
      return NextResponse.json({ count: 0, results: [] });
    }

    const pattern = `%${prompt}%`;

    // Query mejorada: filtra por ILIKE y ordena por relevancia (title > description > instructor),
    // luego por rating y fecha de actualización. Limita a `limit` (máx 5).
    const results = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        instructor: courses.instructor,
        rating: courses.rating,
        coverImageKey: courses.coverImageKey,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
      })
      .from(courses)
      .where(
        sql`${courses.title} ILIKE ${pattern} OR ${courses.description} ILIKE ${pattern} OR ${courses.instructor} ILIKE ${pattern}`
      )
      .orderBy(
        // prioridad por campo que contiene el término
        sql`(CASE WHEN ${courses.title} ILIKE ${pattern} THEN 3 WHEN ${courses.description} ILIKE ${pattern} THEN 2 WHEN ${courses.instructor} ILIKE ${pattern} THEN 1 ELSE 0 END) DESC`,
        // luego por rating y actualización
        sql`${courses.rating} DESC NULLS LAST`,
        sql`${courses.updatedAt} DESC`
      )
      .limit(limit);

    return NextResponse.json({
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('search-courses error:', error);
    return NextResponse.json(
      { error: 'Error buscando cursos' },
      { status: 500 }
    );
  }
}
