import { NextResponse } from 'next/server';

import { sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { categories, courses } from '~/server/db/schema';

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

    let results: {
      id: number;
      title: string;
      description: string | null;
      category: { id: number; name: string };
    }[] = [];

    if (prompt) {
      const pattern = `%${prompt}%`;

      // Busca cursos relacionados por título, descripción o categoría
      const dbResults = await db
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
          sql`${courses.updatedAt} DESC`
        )
        .limit(limit);

      results = dbResults.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category?.id != null ? row.category : { id: 0, name: '' },
      }));

      // Si no se encuentran suficientes cursos, rellena con los más recientes
      if (results.length < limit) {
        const ids = results.map((r) => r.id);
        const fallbackResults = await db
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
            ids.length > 0 ? sql`${courses.id} NOT IN (${ids})` : undefined
          )
          .orderBy(sql`${courses.updatedAt} DESC`)
          .limit(limit - results.length);

        results = [
          ...results,
          ...fallbackResults.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            category:
              row.category?.id != null ? row.category : { id: 0, name: '' },
          })),
        ];
      }
    } else {
      // Si no hay prompt, devuelve los más recientes
      const fallbackResults = await db
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
        .orderBy(sql`${courses.updatedAt} DESC`)
        .limit(limit);

      results = fallbackResults.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category?.id != null ? row.category : { id: 0, name: '' },
      }));
    }

    return NextResponse.json({
      description: `Cursos encontrados:`,
      count: results.length,
      results: results.map((course, idx) => ({
        numero: idx + 1,
        title: course.title,
        description: course.description,
      })),
      source: req.headers.get('x-bedrock-agent') === 'true' ? 'bedrock' : 'api',
    });
  } catch (error) {
    console.error('search-courses error:', error);
    return NextResponse.json(
      { error: 'Error buscando cursos' },
      { status: 500 }
    );
  }
}
