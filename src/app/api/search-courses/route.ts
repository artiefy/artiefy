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

    const results = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        instructor: courses.instructor,
        rating: courses.rating,
        coverImageKey: courses.coverImageKey,
      })
      .from(courses)
      .where(
        sql`${courses.title} ILIKE ${pattern} OR ${courses.description} ILIKE ${pattern} OR ${courses.instructor} ILIKE ${pattern}`
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
