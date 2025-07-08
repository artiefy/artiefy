'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  projectActivities,
  projects,
  projectSchedule,
  specificObjectives,
} from '~/server/db/schema';

export async function updateProject(
  projectId: number,
  fields: Partial<{
    name: string;
    planteamiento: string;
    justificacion: string;
    objetivo_general: string;
    coverImageKey: string | null;
    type_project: string;
    categoryId: number;
    isPublic: boolean;
    objetivos_especificos?: string[];
    actividades?: {
      descripcion: string;
      meses: number[];
    }[];
  }>
): Promise<boolean> {
  const { objetivos_especificos, actividades, ...projectFields } = fields;

  // Actualizar campos del proyecto
  const updated = await db
    .update(projects)
    .set({
      ...projectFields,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  // Actualizar objetivos específicos si se proporcionan
  if (objetivos_especificos) {
    // Eliminar objetivos existentes
    await db
      .delete(specificObjectives)
      .where(eq(specificObjectives.projectId, projectId));

    // Insertar nuevos objetivos
    if (objetivos_especificos.length > 0) {
      const objetivosData = objetivos_especificos.map((desc) => ({
        projectId,
        description: desc,
        createdAt: new Date(),
      }));
      await db.insert(specificObjectives).values(objetivosData);
    }
  }

  // Actualizar actividades y cronograma si se proporcionan
  if (actividades) {
    // Obtener actividades existentes para limpiar cronograma
    const existingActivities = await db
      .select()
      .from(projectActivities)
      .where(eq(projectActivities.projectId, projectId));

    // Eliminar cronograma de actividades existentes
    for (const activity of existingActivities) {
      await db
        .delete(projectSchedule)
        .where(eq(projectSchedule.activityId, activity.id));
    }

    // Eliminar actividades existentes
    await db
      .delete(projectActivities)
      .where(eq(projectActivities.projectId, projectId));

    // Insertar nuevas actividades y cronograma
    if (actividades.length > 0) {
      for (const actividad of actividades) {
        // Insertar actividad
        const [insertedActividad] = await db
          .insert(projectActivities)
          .values({
            projectId,
            description: actividad.descripcion,
          })
          .returning({ id: projectActivities.id });

        const actividadId = insertedActividad?.id;

        // Insertar meses del cronograma
        if (actividadId && actividad.meses.length > 0) {
          const scheduleData = actividad.meses.map((mes) => ({
            activityId: actividadId,
            month: mes,
          }));
          await db.insert(projectSchedule).values(scheduleData);
        }
      }
    }
  }

  return !!updated;
}
