import { NextResponse } from 'next/server';

import { sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { categories, courses } from '~/server/db/schema';

export async function POST(req: Request) {
  try {
    const rawBody = (await req.json().catch(() => ({}))) as unknown;

    let prompt = '';
    let limit = 5;

    // 1. Si viene en parameters
    if (
      rawBody &&
      typeof rawBody === 'object' &&
      'parameters' in rawBody &&
      (rawBody as Record<string, unknown>).parameters !== null
    ) {
      const parametersRaw = (rawBody as Record<string, unknown>).parameters;
      const params =
        Array.isArray(parametersRaw) && parametersRaw.length > 0
          ? parametersRaw[0]
          : parametersRaw;
      if (
        params &&
        typeof params === 'object' &&
        'prompt' in params &&
        typeof (params as Record<string, unknown>).prompt === 'string'
      ) {
        prompt = ((params as Record<string, unknown>).prompt as string).trim();
      }
      if (
        params &&
        typeof params === 'object' &&
        'limit' in params &&
        (params as Record<string, unknown>).limit !== undefined
      ) {
        limit = Number((params as Record<string, unknown>).limit);
      }
    }
    // 2. Si viene en requestBody.content
    else if (
      rawBody &&
      typeof rawBody === 'object' &&
      'requestBody' in rawBody &&
      (rawBody as Record<string, unknown>).requestBody !== null
    ) {
      const requestBody = (rawBody as Record<string, unknown>).requestBody;
      if (
        requestBody &&
        typeof requestBody === 'object' &&
        'content' in requestBody
      ) {
        const content = (requestBody as Record<string, unknown>).content;
        if (Array.isArray(content)) {
          // Puede venir como lista de pares name/value
          for (const item of content) {
            if (
              item &&
              typeof item === 'object' &&
              'name' in item &&
              'value' in item
            ) {
              const name = (item as Record<string, unknown>).name;
              const value = (item as Record<string, unknown>).value;
              if (name === 'prompt' && typeof value === 'string') {
                prompt = value.trim();
              }
              if (name === 'limit' && value !== undefined) {
                limit = Number(value);
              }
            }
          }
        } else if (content && typeof content === 'object') {
          if (
            'prompt' in content &&
            typeof (content as Record<string, unknown>).prompt === 'string'
          ) {
            prompt = (
              (content as Record<string, unknown>).prompt as string
            ).trim();
          }
          if (
            'limit' in content &&
            (content as Record<string, unknown>).limit !== undefined
          ) {
            limit = Number((content as Record<string, unknown>).limit);
          }
        }
      }
    }
    // 3. Si viene directo en el body raíz
    else if (rawBody && typeof rawBody === 'object') {
      const bodyObj = rawBody as Record<string, unknown>;
      if ('prompt' in bodyObj && typeof bodyObj.prompt === 'string') {
        prompt = (bodyObj.prompt as string).trim();
      }
      if ('limit' in bodyObj && bodyObj.limit !== undefined) {
        limit = Number(bodyObj.limit);
      }
    }

    // Normaliza el límite
    if (!Number.isFinite(limit) || limit < 1 || limit > 5) limit = 5;

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
