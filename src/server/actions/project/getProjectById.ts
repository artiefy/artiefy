'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  projectActivities,
  projects,
  projectSchedule,
  specificObjectives,
} from '~/server/db/schema';

export interface ProjectDetail {
  publicComment: boolean;
  id: number;
  name: string;
  planteamiento: string;
  justificacion: string;
  objetivo_general: string;
  coverImageKey?: string | null;
  type_project: string;
  userId: string;
  categoryId: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  objetivos_especificos: {
    id: number;
    description: string;
    actividades: { descripcion: string; meses: number[] }[];
  }[];
  actividades: {
    id: number;
    descripcion: string;
    meses: number[];
    responsibleUserId?: string | null;
    hoursPerDay?: number | null;
  }[];
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo_visualizacion?: 'meses' | 'dias';
}

// Obtener un proyecto específico por ID, incluyendo objetivos y actividades
export async function getProjectById(
  projectId: number
): Promise<ProjectDetail | null> {
  console.info(`[getProjectById] Called with projectId: ${projectId}`);
  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  const project = result[0];
  if (!project) return null;

  const objetivos = await db
    .select()
    .from(specificObjectives)
    .where(eq(specificObjectives.projectId, projectId));

  const actividades = await db
    .select()
    .from(projectActivities)
    .where(eq(projectActivities.projectId, projectId));

  const actividadesConMeses = await Promise.all(
    actividades.map(async (act) => {
      const meses = await db
        .select()
        .from(projectSchedule)
        .where(eq(projectSchedule.activityId, act.id));
      return {
        ...act,
        meses: meses.map((m) => m.month),
      };
    })
  );

  // Relaciona actividades con objetivos específicos usando objectiveId
  const objetivos_especificos = objetivos.map((o) => {
    const actividadesRelacionadas = actividadesConMeses
      .filter((a) => a.objectiveId === o.id)
      .map((a) => ({
        descripcion: a.description,
        meses: a.meses,
      }));

    return {
      id: o.id,
      description: o.description,
      actividades: actividadesRelacionadas,
    };
  });

  // Todas las actividades (para compatibilidad)
  const actividadesSimple = actividadesConMeses.map((a) => ({
    id: a.id,
    descripcion: a.description,
    meses: a.meses,
    responsibleUserId: a.responsibleUserId ?? null,
    hoursPerDay: a.hoursPerDay ?? null,
  }));

  const projectDetail: ProjectDetail = {
    id: project.id,
    name: project.name ?? 'Untitled Project',
    planteamiento: project.planteamiento,
    justificacion: project.justificacion,
    objetivo_general: project.objetivo_general,
    coverImageKey: project.coverImageKey ?? null,
    type_project: project.type_project,
    userId: project.userId,
    categoryId: project.categoryId,
    isPublic: project.isPublic,
    createdAt: project.createdAt
      ? new Date(project.createdAt).toISOString()
      : '',
    updatedAt: project.updatedAt
      ? new Date(project.updatedAt).toISOString()
      : '',
    objetivos_especificos,
    actividades: actividadesSimple,
    // Devuelve fechas en formato YYYY-MM-DD para inputs tipo date y lógica de días
    fecha_inicio: project.fecha_inicio
      ? new Date(project.fecha_inicio).toISOString().split('T')[0]
      : undefined,
    fecha_fin: project.fecha_fin
      ? new Date(project.fecha_fin).toISOString().split('T')[0]
      : undefined,
    tipo_visualizacion: project.tipo_visualizacion ?? undefined,
    publicComment: false
  };

  console.info(`[getProjectById] Returning project:`, projectDetail);

  return projectDetail;
}
