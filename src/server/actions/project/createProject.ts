'use server';

import { db } from '~/server/db';
import {
  projects,
  specificObjectives,
  projectActivities,
  projectSchedule,
} from '~/server/db/schema';

interface ProjectData {
  name: string;
  planteamiento: string;
  justificacion: string;
  objetivo_general: string;
  objetivos_especificos?: string[];
  actividades?: {
    descripcion: string;
    meses: number[]; // Ej: [0, 1, 2] para Ene-Feb-Mar
  }[];
  integrantes?: number[]; // Aún no usados
  coverImageKey?: string;
  type_project: string;
  categoryId: number;
}

// Crear proyecto, objetivos específicos, actividades y cronograma
export async function createProject(userId: string, projectData: ProjectData): Promise<void> {
  // 1. Crear el proyecto
  const insertedProjects = await db
    .insert(projects)
    .values({
      name: projectData.name,
      planteamiento: projectData.planteamiento,
      justificacion: projectData.justificacion,
      objetivo_general: projectData.objetivo_general,
      coverImageKey: projectData.coverImageKey ?? null,
      type_project: projectData.type_project,
      userId,
      categoryId: projectData.categoryId,
    })
    .returning({ id: projects.id });

  const projectId = insertedProjects[0]?.id;
  if (!projectId) {
    throw new Error('No se pudo crear el proyecto');
  }

  // 2. Insertar objetivos específicos
  if (
    projectData.objetivos_especificos &&
    projectData.objetivos_especificos.length > 0
  ) {
    const objetivosData = projectData.objetivos_especificos.map((desc) => ({
      projectId,
      description: desc,
    }));
    await db.insert(specificObjectives).values(objetivosData);
  }

  // 3. Insertar actividades y cronograma
  if (projectData.actividades && projectData.actividades.length > 0) {
    for (const actividad of projectData.actividades) {
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
