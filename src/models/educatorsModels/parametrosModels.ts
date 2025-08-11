import { eq, inArray, sql } from "drizzle-orm";

import { db } from "~/server/db/index";
import {
  activities,
  parametros,
  userActivitiesProgress,
} from "~/server/db/schema";

export interface Parametros {
  id: number;
  name: string;
  description: string;
  porcentaje: number;
  courseId: number;
}

// Crear un parámetro
export const createParametros = async ({
  name,
  description,
  porcentaje,
  courseId,
}: {
  name: string;
  description: string;
  porcentaje: number;
  courseId: number;
}) => {
  return db.insert(parametros).values({
    name,
    description,
    porcentaje,
    courseId,
  });
};

// Obtener parámetros
export async function getParametros() {
  const result: Parametros[] = await db.select().from(parametros);
  return result;
}

// Obtener parámetros por ID de curso
export async function getParametrosByCourseId(
  courseId: number,
): Promise<Parametros[]> {
  try {
    const result: Parametros[] = await db
      .select()
      .from(parametros)
      .where(eq(parametros.courseId, courseId));
    return result;
  } catch (error) {
    console.error("Error al obtener los parámetros:", error);
    throw new Error("Error al obtener los parámetros");
  }
}

// Obtener parámetro por ID
export async function getParametroById(id: number) {
  const result: Parametros[] = await db
    .select()
    .from(parametros)
    .where(eq(parametros.id, id));
  return result;
}

// Actualizar un parámetro
export const updateParametro = async ({
  id,
  name,
  description,
  porcentaje,
  courseId,
}: {
  id: number;
  name: string;
  description: string;
  porcentaje: number;
  courseId: number;
}) => {
  try {
    const parametroActualizado = await db
      .update(parametros)
      .set({ name, description, porcentaje, courseId })
      .where(eq(parametros.id, id));
    return parametroActualizado;
  } catch (error) {
    console.error("Error al actualizar el parámetro:", error);
    throw error;
  }
};

// Eliminar un parámetro
export async function deleteParametro(id: number) {
  const parametroEliminado = await db
    .delete(parametros)
    .where(eq(parametros.id, id));
  return parametroEliminado;
}

export const deleteParametroByCourseId = async (courseId: number) => {
  try {
    console.log(`[1] ⏳ Buscando parámetros del curso ${courseId}`);
    const parametroIds = await db
      .select({ id: parametros.id })
      .from(parametros)
      .where(eq(parametros.courseId, courseId));

    const ids = parametroIds.map((p) => p.id);
    console.log(`[2] 📋 Parámetros encontrados:`, ids);

    if (ids.length === 0) {
      console.log("[3] ⚠️ No hay parámetros que eliminar.");
      return;
    }

    // Buscar IDs de actividades ligadas a esos parámetros
    const activityIds = await db
      .select({ id: activities.id })
      .from(activities)
      .where(inArray(activities.parametroId, ids));

    const actIds = activityIds.map((a) => a.id);
    console.log(`[4] 🔗 Actividades encontradas:`, actIds);

    // Borrar userActivitiesProgress si hay actividades relacionadas
    if (actIds.length > 0) {
      console.log("[5] 🧽 Borrando user_activities_progress...");
      await db
        .delete(userActivitiesProgress)
        .where(inArray(userActivitiesProgress.activityId, actIds));
    }

    // Borrar actividades
    console.log("[6] 🧨 Borrando actividades...");
    await db.delete(activities).where(inArray(activities.parametroId, ids));

    if (Array.isArray(ids) && ids.length > 0) {
      console.log("[7] 🧮 Borrando parameter_grades...");
      console.log("[7-debug] ids a eliminar:", ids);

      if (ids.length > 0) {
        console.log("[7-debug] ids a eliminar:", ids);

        const rawIds = sql.join(
          ids.map((id) => sql.raw(String(id))),
          sql.raw(", "),
        );

        await db.execute(
          sql`DELETE FROM parameter_grades WHERE parameter_id IN (${rawIds})`,
        );
      }
    } else {
      console.log("[7] ⚠️ No hay parámetros para eliminar en parameter_grades");
    }

    // Finalmente, borrar parámetros
    console.log("[8] 🗑️ Borrando parámetros...");
    await db.delete(parametros).where(eq(parametros.courseId, courseId));

    console.log("[9] ✅ Eliminación exitosa para courseId:", courseId);
  } catch (error) {
    console.error("❌ Error al eliminar parámetros y dependencias:\n", error);
    throw error;
  }
};
