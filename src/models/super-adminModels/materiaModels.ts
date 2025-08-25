import { eq } from 'drizzle-orm'; // ✅ Importar inArray

import { db } from '~/server/db';
import { materias } from '~/server/db/schema';

export interface Materia {
  id: number;
  title: string;
  description: string;
}

export const getAllMaterias = async () => {
  const allMaterias = await db.select().from(materias).execute();

  // Crea un Map para evitar duplicados por título
  const uniqueMateriasMap = new Map<string, (typeof allMaterias)[number]>();

  for (const materia of allMaterias) {
    // Si aún no existe una materia con ese título, la agrega
    if (!uniqueMateriasMap.has(materia.title)) {
      uniqueMateriasMap.set(materia.title, materia);
    }
  }

  // Retorna solo los valores únicos y ordenados por título
  return Array.from(uniqueMateriasMap.values()).sort((a, b) =>
    a.title.localeCompare(b.title)
  );
};

export const getAllMateriasFull = async () => {
  const allMaterias = await db.select().from(materias).execute();

  const uniqueMateriasMap = new Map<string, (typeof allMaterias)[number]>();

  for (const materia of allMaterias) {
    if (!uniqueMateriasMap.has(materia.title)) {
      uniqueMateriasMap.set(materia.title, materia);
    }
  }

  return Array.from(uniqueMateriasMap.values());
};

export const getMateriaById = async (id: number) => {
  if (typeof id !== 'number') {
    throw new Error('ID must be a number');
  }
  const result = await db
    .select()
    .from(materias)
    .where(eq(materias.id, id))
    .execute();
  return result.length ? result[0] : null;
};

export const updateMateria = async (id: number, materia: Partial<Materia>) => {
  if (!id) throw new Error('ID is required for update');
  try {
    const updateResult = await db
      .update(materias)
      .set(materia)
      .where(eq(materias.id, id))
      .execute();

    return updateResult;
  } catch (error) {
    console.error('Database error:', error); // Muestra el error de la base de datos
    throw new Error('Database operation failed');
  }
};

export const createMateria = async (materia: Omit<Materia, 'id'>) => {
  if (!materia.title || !materia.description) {
    throw new Error('Title and description are required');
  }
  const insertResult = await db
    .insert(materias)
    .values({
      title: materia.title,
      description: materia.description,
    })
    .returning(); // Retorna todos los campos de la nueva fila insertada
  return insertResult[0]; // Asumiendo que `returning()` devuelve un array
};

export const deleteMateria = async (id: number): Promise<void> => {
  if (typeof id !== 'number') {
    throw new Error('ID must be a number for a valid deletion operation.');
  }
  // Utiliza `eq` para asegurar que la condición de eliminación es segura y precisa.
  await db.delete(materias).where(eq(materias.id, id)).execute();
};
