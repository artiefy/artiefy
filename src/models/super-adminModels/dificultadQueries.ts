import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { dificultad } from '~/server/db/schema';

// Obtener todas las dificultades
export async function getDificultades() {
  return await db.select().from(dificultad);
}

// Crear una dificultad
export async function createDificultad(name: string, description: string) {
  return await db.insert(dificultad).values({ name, description }).returning();
}

// Actualizar una dificultad
export async function updateDificultad(id: number, name: string, description: string) {
  return await db.update(dificultad).set({ name, description }).where(eq(dificultad.id, id)).returning();
}

// Eliminar una dificultad
export async function deleteDificultad(id: number) {
  return await db.delete(dificultad).where(eq(dificultad.id, id));
}
