import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { categories } from '~/server/db/schema';

// Obtener todas las categorías
export async function getCategories() {
  return await db.select().from(categories);
}

// Crear una categoría
export async function createCategory(name: string, description: string) {
  return await db.insert(categories).values({ name, description }).returning();
}

// Actualizar una categoría
export async function updateCategory(id: number, name: string, description: string) {
  return await db.update(categories).set({ name, description }).where(eq(categories.id, id)).returning();
}

// Eliminar una categoría
export async function deleteCategory(id: number) {
  return await db.delete(categories).where(eq(categories.id, id));
}
