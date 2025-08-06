'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  projectActivities,
  projects,
  projectSchedule,
  specificObjectives,
} from '~/server/db/schema';

interface UpdateProjectData {
  name?: string;
  planteamiento?: string;
  justificacion?: string;
  objetivo_general?: string;
  objetivos_especificos?: string[];
  actividades?: {
    descripcion: string;
    meses: number[];
    objetivoId?: string;
    responsibleUserId?: string; // <-- Añadir
    hoursPerDay?: number; // <-- Añadir
  }[];
  coverImageKey?: string;
  type_project?: string;
  categoryId?: number;
  isPublic?: boolean;
  fechaInicio?: string;
  fechaFin?: string;
  tipoVisualizacion?: 'meses' | 'dias';
  publicComment?: string; // <-- Nuevo campo
}

export async function updateProject(
  projectId: number,
  projectData: UpdateProjectData
): Promise<{ success: boolean }> {
  const user = await currentUser();

  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  // Verificar que el proyecto existe y pertenece al usuario
  const existingProject = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!existingProject) {
    throw new Error('Proyecto no encontrado');
  }

  if (existingProject.userId !== user.id) {
    throw new Error('No tienes permisos para actualizar este proyecto');
  }

  // Preparar datos de actualización con tipos correctos
  const updateData: {
    name?: string;
    planteamiento?: string;
    justificacion?: string;
    objetivo_general?: string;
    coverImageKey?: string;
    type_project?: string;
    categoryId?: number;
    isPublic?: boolean;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    tipo_visualizacion?: 'meses' | 'dias';
    publicComment?: string;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (projectData.name !== undefined) updateData.name = projectData.name;
  if (projectData.planteamiento !== undefined)
    updateData.planteamiento = projectData.planteamiento;
  if (projectData.justificacion !== undefined)
    updateData.justificacion = projectData.justificacion;
  if (projectData.objetivo_general !== undefined)
    updateData.objetivo_general = projectData.objetivo_general;
  if (projectData.coverImageKey !== undefined)
    updateData.coverImageKey = projectData.coverImageKey;
  if (projectData.type_project !== undefined)
    updateData.type_project = projectData.type_project;
  if (projectData.categoryId !== undefined)
    updateData.categoryId = projectData.categoryId;
  if (projectData.isPublic !== undefined)
    updateData.isPublic = projectData.isPublic;
  if (projectData.fechaInicio !== undefined && projectData.fechaInicio !== '') {
    updateData.fecha_inicio = projectData.fechaInicio;
  }
  if (projectData.fechaFin !== undefined && projectData.fechaFin !== '') {
    updateData.fecha_fin = projectData.fechaFin;
  }
  if (projectData.tipoVisualizacion !== undefined) {
    updateData.tipo_visualizacion = projectData.tipoVisualizacion;
  }
  if (projectData.publicComment !== undefined)
    updateData.publicComment = projectData.publicComment;

  // DEBUG: Verifica los datos que se van a actualizar
  console.log('updateData:', updateData);

  // Actualizar el proyecto
  await db.update(projects).set(updateData).where(eq(projects.id, projectId));

  // Actualizar objetivos específicos si se proporcionan
  if (projectData.objetivos_especificos) {
    // Eliminar objetivos existentes
    await db
      .delete(specificObjectives)
      .where(eq(specificObjectives.projectId, projectId));

    // Insertar nuevos objetivos
    if (projectData.objetivos_especificos.length > 0) {
      const objetivosData = projectData.objetivos_especificos.map((desc) => ({
        projectId,
        description: desc,
        createdAt: new Date(),
      }));
      await db.insert(specificObjectives).values(objetivosData);
    }
  }

  // Actualizar actividades y cronograma si se proporcionan
  if (projectData.actividades) {
    // Obtener IDs de actividades existentes
    const existingActivities = await db.query.projectActivities.findMany({
      where: eq(projectActivities.projectId, projectId),
      columns: { id: true },
    });

    // Eliminar cronograma existente
    for (const activity of existingActivities) {
      await db
        .delete(projectSchedule)
        .where(eq(projectSchedule.activityId, activity.id));
    }

    // Eliminar actividades existentes
    await db
      .delete(projectActivities)
      .where(eq(projectActivities.projectId, projectId));

    // Filtrar actividades válidas (con descripción no vacía)
    const actividadesValidas = projectData.actividades.filter(
      (actividad) =>
        actividad.descripcion && actividad.descripcion.trim() !== ''
    );

    // Insertar nuevas actividades y cronograma
    if (actividadesValidas.length > 0) {
      for (const actividad of actividadesValidas) {
        const [insertedActividad] = await db
          .insert(projectActivities)
          .values({
            projectId,
            description: actividad.descripcion,
            responsibleUserId: actividad.responsibleUserId ?? null,
            hoursPerDay: actividad.hoursPerDay ?? 1,
          })
          .returning({ id: projectActivities.id });

        const actividadId = insertedActividad?.id;

        // Insertar cronograma
        if (actividadId && actividad.meses && actividad.meses.length > 0) {
          const scheduleData = actividad.meses.map((mes) => ({
            activityId: actividadId,
            month: mes,
          }));
          await db.insert(projectSchedule).values(scheduleData);
        }
      }
    }
  }

  return { success: true };
}
