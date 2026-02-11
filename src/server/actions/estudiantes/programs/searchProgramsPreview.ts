'use server';

import { eq, or, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { categories, programas } from '~/server/db/schema';

import type { Program } from '~/types';

export async function searchProgramsPreview(query: string): Promise<Program[]> {
  if (!query || query.trim().length < 2) return [];
  const normalizedQuery = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  const accentFrom = 'áàäâãåÁÀÄÂÃÅéèëêÉÈËÊíìïîÍÌÏÎóòöôõÓÒÖÔÕúùüûÚÙÜÛñÑçÇ';
  const accentTo = 'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUnNcC';
  const searchPattern = `%${normalizedQuery}%`;
  const normalizeColumn = (column: unknown) =>
    sql`translate(lower(${column}), ${accentFrom}, ${accentTo})`;

  const results = await db
    .select({
      id: programas.id,
      title: programas.title,
      description: programas.description,
      coverImageKey: programas.coverImageKey,
      createdAt: programas.createdAt,
      updatedAt: programas.updatedAt,
      creatorId: programas.creatorId,
      rating: programas.rating,
      categoryid: programas.categoryid,
      categoryName: categories.name,
    })
    .from(programas)
    .leftJoin(categories, eq(programas.categoryid, categories.id))
    .where(
      or(
        sql`${normalizeColumn(programas.title)} ilike ${searchPattern}`,
        sql`${normalizeColumn(categories.name)} ilike ${searchPattern}`,
        sql`${normalizeColumn(programas.description)} ilike ${searchPattern}`
      )
    )
    .limit(8);

  return results.map((program) => ({
    id: program.id.toString(),
    title: program.title ?? '',
    description: program.description ?? null,
    coverImageKey: program.coverImageKey ?? null,
    createdAt: program.createdAt ?? null,
    updatedAt: program.updatedAt ?? null,
    creatorId: program.creatorId ?? '',
    rating: program.rating ?? 0,
    categoryid: program.categoryid,
    category: program.categoryid
      ? {
          id: program.categoryid,
          name: program.categoryName ?? '',
          description: '',
          is_featured: false,
        }
      : undefined,
    creator: undefined,
    materias: [],
    enrollmentPrograms: [],
  }));
}
