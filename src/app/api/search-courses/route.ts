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
    }

    // Si no hay resultados, NO inventes cursos, solo devuelve vacío
    if (!results || results.length === 0) {
      // Devuelve los cursos más recientes si no hay coincidencias
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

      return NextResponse.json({
        description: `No hay cursos relacionados con "${prompt}". Mostrando los cursos más recientes.`,
        count: fallbackResults.length,
        results: fallbackResults.map((course, idx) => ({
          numero: idx + 1,
          title: course.title,
          description: course.description,
        })),
        source:
          req.headers.get('x-bedrock-agent') === 'true' ? 'bedrock' : 'api',
      });
    }

    return NextResponse.json({
      description: `Se encontraron ${results.length} curso(s) relacionados con "${prompt}".`,
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
