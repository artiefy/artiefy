import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { activities, parametros } from '~/server/db/schema';

/**
 * Calcula el porcentaje sugerido para una nueva actividad de un parámetro.
 * Si el parámetro ya tiene el máximo de actividades, retorna null.
 * @param parametroId ID del parámetro
 * @returns porcentaje sugerido (number) o null si está lleno
 */
export async function getSuggestedPercentage(
  parametroId: number
): Promise<number | null> {
  // Obtener info del parámetro
  const param = await db
    .select({
      id: parametros.id,
      porcentaje: parametros.porcentaje,
      numberOfActivities: parametros.numberOfActivities,
    })
    .from(parametros)
    .where(eq(parametros.id, parametroId))
    .then((rows) => rows[0]);

  if (!param || !param.numberOfActivities || param.numberOfActivities <= 0)
    return null;

  // Contar actividades existentes para este parámetro
  const actividades = await db
    .select({ id: activities.id })
    .from(activities)
    .where(eq(activities.parametroId, parametroId));

  if (actividades.length >= param.numberOfActivities) {
    // Ya está lleno
    return null;
  }

  // Calcular sugerido
  const sugerido = Math.round((100 / param.numberOfActivities) * 100) / 100;
  return sugerido;
}
