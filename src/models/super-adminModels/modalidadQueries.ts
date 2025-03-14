import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { modalidades } from '~/server/db/schema';

// Obtener todas las modalidades
export async function getModalidades() {
  return await db.select().from(modalidades);
}

// Crear una modalidad
export async function createModalidad(name: string, description: string) {
  return await db.insert(modalidades).values({ name, description }).returning();
}

// Actualizar una modalidad
export async function updateModalidad(id: number, name: string, description: string) {
  return await db.update(modalidades).set({ name, description }).where(eq(modalidades.id, id)).returning();
}

// Eliminar una modalidad
export async function deleteModalidad(id: number) {
  return await db.delete(modalidades).where(eq(modalidades.id, id));
}
