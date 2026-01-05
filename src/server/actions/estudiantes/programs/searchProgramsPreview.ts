'use server';

import { eq, ilike, or } from 'drizzle-orm';

import { db } from '~/server/db';
import { categories, programas } from '~/server/db/schema';

import type { Program } from '~/types';

export async function searchProgramsPreview(query: string): Promise<Program[]> {
  if (!query || query.trim().length < 2) return [];
  const normalizedQuery = query.trim().toLowerCase();

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
        ilike(programas.title, `%${normalizedQuery}%`),
        ilike(categories.name, `%${normalizedQuery}%`),
        ilike(programas.description, `%${normalizedQuery}%`)
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
