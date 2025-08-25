import { db } from '~/server/db';
import { projectsTaken } from '~/server/db/schema';

interface CreateTakenData {
  userId: string;
  projectId: number;
}

export async function createTaken(data: CreateTakenData) {
  try {
    const [newTaken] = await db
      .insert(projectsTaken)
      .values({
        userId: data.userId,
        projectId: data.projectId,
        createdAt: new Date(),
      })
      .returning();

    return newTaken;
  } catch (error) {
    console.error('Error al crear la relación taken:', error);
    throw new Error('No se pudo crear la relación taken');
  }
}
