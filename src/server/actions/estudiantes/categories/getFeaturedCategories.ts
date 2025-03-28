'use server';

import { eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { categories, courses } from '~/server/db/schema';

import type { Category } from '~/types';

// Opción 1: Sin caché
export async function getFeaturedCategories(limit = 6): Promise<Category[]> {
	try {
		const featuredCategories = await db
			.select({
				id: categories.id,
				name: categories.name,
				description: categories.description,
				is_featured: categories.is_featured,
				courseCount: sql<number>`COUNT(${courses.id})`,
			})
			.from(categories)
			.leftJoin(courses, eq(categories.id, courses.categoryid))
			.where(eq(categories.is_featured, true))
			.groupBy(categories.id)
			.limit(Number(limit));

		return featuredCategories.map((category) => ({
			...category,
			courses: { length: Number(category.courseCount) },
		}));
	} catch (error) {
		console.error('Error fetching featured categories:', error);
		throw new Error(
			'Failed to fetch featured categories: ' +
				(error instanceof Error ? error.message : String(error))
		);
	}
}

/* 
// Opción 2: Con caché pero con key dinámico
import { unstable_cache } from 'next/cache';

export const getFeaturedCategories = unstable_cache(
  async (limit = 6): Promise<Category[]> => {
    // ... mismo código de arriba ...
  },
  [`featuredCategories-${Date.now()}`], // Key dinámico que fuerza nueva caché
  { revalidate: 0 } // 0 segundos = sin caché
);
*/
