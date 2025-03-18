
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { materias } from '~/server/db/schema';


export interface Materia {
  id: number;
  title: string;
  description: string;
}

// Asumiendo que `materias` tiene las columnas definidas en su esquema
export const getAllMaterias = async () => {
  return db.select().from(materias).execute();
};


export const getMateriaById = async (id: number) => {
    if (typeof id !== 'number') {
      throw new Error('ID must be a number');
    }
    const result = await db.select().from(materias).where(eq(materias.id, id)).execute();
    return result.length ? result[0] : null;
  };
  
  export const updateMateria = async (id: number, materia: Partial<Materia>) => {
    if (!id) throw new Error('ID is required for update');
    try {
        const updateResult = await db.update(materias).set(materia).where(eq(materias.id, id)).execute();
       
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
    const insertResult = await db.insert(materias).values({
      title: materia.title,
      description: materia.description,
    }).returning(); // Retorna todos los campos de la nueva fila insertada
    return insertResult[0]; // Asumiendo que `returning()` devuelve un array
  };
  
  

export const deleteMateria = async (id: number): Promise<void> => {
    if (typeof id !== 'number') {
      throw new Error('ID must be a number for a valid deletion operation.');
    }
    // Utiliza `eq` para asegurar que la condición de eliminación es segura y precisa.
    await db.delete(materias).where(eq(materias.id, id)).execute();
  };
