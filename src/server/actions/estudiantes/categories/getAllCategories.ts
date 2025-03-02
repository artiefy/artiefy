'use server';

import { eq, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from '~/server/db';
import { categories, courses } from '~/server/db/schema';

import type { Category } from '~/types';

// Obtener todas las categorías
export const getAllCategories = unstable_cache(
	async (): Promise<Category[]> => {
		try {
			const allCategories = await db
				.select({
					id: categories.id,
					name: categories.name,
					description: categories.description,
					is_featured: categories.is_featured,
					courseCount: sql<number>`COUNT(${courses.id})`,
				})
				.from(categories)
				.leftJoin(courses, eq(categories.id, courses.categoryid))
				.groupBy(categories.id);

			return allCategories.map((category) => ({
				...category,
				courses: { length: Number(category.courseCount) },
			}));
		} catch (error) {
			console.error('Error fetching categories:', error);
			throw new Error(
				'Failed to fetch categories: ' +
					(error instanceof Error ? error.message : String(error))
			);
		}
	},
	['all-categories'],
	{ revalidate: 3600 }
);