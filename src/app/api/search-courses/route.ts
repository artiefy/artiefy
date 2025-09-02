import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { courses, categories } from '~/server/db/schema';

export async function POST(req: Request) {
  try {
    const rawBody = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
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

    // Solo selecciona id, title, description y category (id, name)
    const results = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(courses)
      .leftJoin(categories, sql`${courses.categoryid} = ${categories.id}`)
      .where(
        sql`
          ${courses.title} ILIKE ${pattern}
          OR ${courses.description} ILIKE ${pattern}
          OR ${categories.name} ILIKE ${pattern}
        `
      )
      .orderBy(
        sql`(CASE WHEN ${courses.title} ILIKE ${pattern} THEN 3 WHEN ${courses.description} ILIKE ${pattern} THEN 2 WHEN ${categories.name} ILIKE ${pattern} THEN 1 ELSE 0 END) DESC`,
        sql`${courses.id} ASC`
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
