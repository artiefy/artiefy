import { eq } from "drizzle-orm";
import { db } from "~/server/db/index";
import { activities } from "~/server/db/schema";

// Interfaces
export interface Activity {
  id: number;
  name: string;
  description: string | null;
  tipo: string;
  lessonsId: number;
}

// Validaciones
const validateActivity = (activity: Partial<Activity>) => {
  if (!activity.name || activity.name.length === 0) {
    throw new Error("El nombre de la actividad es requerido");
  }
  if (!activity.tipo || activity.tipo.length === 0) {
    throw new Error("El tipo de actividad es requerido");
  }
  if (!activity.lessonsId) {
    throw new Error("El ID de la lección es requerido");
  }
};

// CRUD Operations

// Crear una nueva actividad
export const createActivity = async ({
  name,
  description,
  tipo,
  lessonsId,
}: Omit<Activity, "id">): Promise<void> => {
  try {
    validateActivity({ name, description, tipo, lessonsId });
    await db.insert(activities).values({
      name,
      description,
      typeid: parseInt(tipo, 10),
      lessonsId,
    });
  } catch (error) {
    throw new Error(
      `Error al crear la actividad: ${error instanceof Error ? error.message : "Error desconocido"}`,
    );
  }
};

// Obtener una actividad por ID
export const getActivityById = async (
  activityId: number,
): Promise<Activity | null> => {
  try {
    const result = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);
    if (result.length === 0) return null;
    const { id, name, description, typeid, lessonsId } = result[0];
    return { id, name, description, tipo: typeid.toString(), lessonsId };
  } catch (error) {
    throw new Error(
      `Error al obtener la actividad: ${error instanceof Error ? error.message : "Error desconocido"}`,
    );
  }
};

// Obtener todas las actividades de una lección
export const getActivitiesByLessonId = async (
  lessonId: number,
): Promise<Activity[]> => {
  try {
    const results = await db
      .select()
      .from(activities)
      .where(eq(activities.lessonsId, lessonId));

    return results.map(({ id, name, description, typeid, lessonsId }) => ({
      id,
      name,
      description,
      tipo: typeid.toString(),
      lessonsId,
    }));
  } catch (error) {
    throw new Error(
      `Error al obtener las actividades de la lección: ${error instanceof Error ? error.message : "Error desconocido"}`,
    );
  }
};

// Actualizar una actividad
export const updateActivity = async (
  activityId: number,
  { name, description, tipo }: Partial<Omit<Activity, "id" | "lessonsId">>,
): Promise<void> => {
  try {
    const updateData: Partial<Activity> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (tipo !== undefined) updateData.tipo = tipo;

    validateActivity(updateData);

    await db
      .update(activities)
      .set(updateData)
      .where(eq(activities.id, activityId));
  } catch (error) {
    throw new Error(
      `Error al actualizar la actividad: ${error instanceof Error ? error.message : "Error desconocido"}`,
    );
  }
};

// Eliminar una actividad
export const deleteActivity = async (activityId: number): Promise<void> => {
  try {
    await db.delete(activities).where(eq(activities.id, activityId));
  } catch (error) {
    throw new Error(
      `Error al eliminar la actividad: ${error instanceof Error ? error.message : "Error desconocido"}`,
    );
  }
};
