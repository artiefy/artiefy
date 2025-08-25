import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { nivel } from '~/server/db/schema';

// Obtener todas las
export async function getNivel() {
  return await db.select().from(nivel);
}

// Crear una
export async function createNivel(name: string, description: string) {
  return await db.insert(nivel).values({ name, description }).returning();
}

// Actualizar una nivel
export async function updateNivel(
  id: number,
  name: string,
  description: string
) {
  return await db
    .update(nivel)
    .set({ name, description })
    .where(eq(nivel.id, id))
    .returning();
}

// Eliminar una nivel
export async function deleteNivel(id: number) {
  return await db.delete(nivel).where(eq(nivel.id, id));
}
