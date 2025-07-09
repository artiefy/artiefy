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
  objetivos_especificos: string[];
  actividades: { descripcion: string; meses: number[] }[];
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo_visualizacion?: 'meses' | 'dias';
}

// Obtener un proyecto específico por ID, incluyendo objetivos y actividades
export async function getProjectById(
  projectId: number
): Promise<ProjectDetail | null> {
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

  return {
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
    objetivos_especificos: objetivos.map((o) => o.description),
    actividades: actividadesConMeses.map((a) => ({
      descripcion: a.description,
      meses: a.meses,
    })),
    fecha_inicio: project.fecha_inicio
      ? new Date(project.fecha_inicio).toISOString()
      : undefined,
    fecha_fin: project.fecha_fin
      ? new Date(project.fecha_fin).toISOString()
      : undefined,
    tipo_visualizacion: project.tipo_visualizacion ?? undefined,
  };
}
