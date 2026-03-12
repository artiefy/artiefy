import { eq, sum } from 'drizzle-orm';

import { db } from '~/server/db';
import { activities, parametros } from '~/server/db/schema';

export async function getSuggestedPercentage(
  parametroId: number
): Promise<number | null> {
  const param = await db
    .select({
      id: parametros.id,
      porcentaje: parametros.porcentaje,
      numberOfActivities: parametros.numberOfActivities,
    })
    .from(parametros)
    .where(eq(parametros.id, parametroId))
    .then((rows) => rows[0]);

  if (!param) return null;

  // Sumar porcentajes ya usados por actividades existentes
  const [result] = await db
    .select({ totalUsado: sum(activities.porcentaje) })
    .from(activities)
    .where(eq(activities.parametroId, parametroId));

  const totalUsado = Number(result?.totalUsado ?? 0);

  // ✅ Comparar contra numberOfActivities si existe,
  // o contra 100 como tope interno del parámetro
  const tope =
    param.numberOfActivities && param.numberOfActivities > 0
      ? (100 / param.numberOfActivities) *
        (await db
          .select({ id: activities.id })
          .from(activities)
          .where(eq(activities.parametroId, parametroId))
          .then((r) => r.length))
      : 100;

  const porcentajeDisponible = 100 - totalUsado;

  // ✅ Aún hay porcentaje disponible dentro del parámetro
  if (porcentajeDisponible <= 0) return null;

  // ✅ Verificar límite de actividades
  if (param.numberOfActivities && param.numberOfActivities > 0) {
    const countActividades = await db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.parametroId, parametroId))
      .then((r) => r.length);

    if (countActividades >= param.numberOfActivities) return null;

    const restantes = param.numberOfActivities - countActividades;
    return Math.round((porcentajeDisponible / restantes) * 100) / 100;
  }

  return porcentajeDisponible;
}
