'use server';

import { db } from '~/server/db';

/**
 * Obtiene todas las categorías activas
 */
export async function getCategories() {
  try {
    const categories = await db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });

    return categories;
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return [];
  }
}

/**
 * Obtiene una categoría por ID
 */
export async function getCategoryById(id: number) {
  try {
    const category = await db.query.categories.findFirst({
      where: (categories, { eq }) => eq(categories.id, id),
    });

    return category;
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    return null;
  }
}
