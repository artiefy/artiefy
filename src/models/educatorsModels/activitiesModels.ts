import { eq } from 'drizzle-orm';
import { db } from '~/server/db/index';
import { activities } from '~/server/db/schema';

// Interfaces
export interface Activity {
  id: number;
  name: string;
  description: string | null;
  typeid: number;
  lessonsId: number;
}

// CRUD Operations
// Crear una nueva actividad
export const createActivity = async ({
  name,
  description,
  typeid,
  lessonsId,
}: Omit<Activity, 'id'>): Promise<void> => {
  try {
    await db.insert(activities).values({
      name,
      description,
      typeid,
      lessonsId,
    });
  } catch (error) {
    throw new Error(
      `Error al crear la actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

// Obtener una actividad por ID
export const getActivityById = async (
  activityId: number
): Promise<Activity | null> => {
  try {
    const result = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);
    return result[0] ?? null;
  } catch (error) {
    throw new Error(
      `Error al obtener la actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

// Obtener todas las actividades de una lección
export const getActivitiesByLessonId = async (
  lessonId: number
): Promise<Activity[]> => {
  try {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.lessonsId, lessonId));
  } catch (error) {
    throw new Error(
      `Error al obtener las actividades de la lección: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

// Actualizar una actividad
export const updateActivity = async (
  activityId: number,
  { name, description, typeid }: Partial<Omit<Activity, 'id' | 'lessonsId'>>
): Promise<void> => {
  try {
    const updateData: Partial<Omit<Activity, 'id' | 'lessonsId'>> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (typeid !== undefined) updateData.typeid = typeid;

    await db
      .update(activities)
      .set(updateData)
      .where(eq(activities.id, activityId));
  } catch (error) {
    throw new Error(
      `Error al actualizar la actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

// Eliminar una actividad
export const deleteActivity = async (activityId: number): Promise<void> => {
  try {
    await db.delete(activities).where(eq(activities.id, activityId));
  } catch (error) {
    throw new Error(
      `Error al eliminar la actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};
