'use server';

import { cache } from 'react';
import { db } from '~/server/db';
import {
  categories,
  courses,
} from '~/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { Category } from '~/types';

// Obtener categorías destacadas
export const getFeaturedCategories = cache(
  async (limit = 6): Promise<Category[]> => {
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
        .limit(limit);

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
);
