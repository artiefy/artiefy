'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  categories,
  projectActivities,
  projects,
  projectSchedule,
  specificObjectives,
} from '~/server/db/schema';

export interface ProjectDetail {
  publicComment: boolean;
  id: number;
  name: string;
  description?: string;
  planteamiento: string;
  justificacion: string;
  objetivo_general: string;
  requirements?: string;
  coverImageKey?: string | null;
  coverVideoKey?: string | null;
  type_project: string;
  userId: string;
  categoryId: number;
  categoryName?: string;
  isPublic: boolean;
  needsCollaborators?: boolean;
  createdAt: string;
  updatedAt: string;
  progressPercentage?: number;
  objetivos_especificos: {
    id: number;
    description: string;
    actividades: {
      id: number;
      descripcion: string;
      meses: number[];
      startDate?: string;
      endDate?: string;
      deliverableKey?: string | null;
      deliverableUrl?: string | null;
      deliverableName?: string | null;
      deliverableDescription?: string | null;
      deliverableSubmittedAt?: string | null;
    }[];
  }[];
  actividades: {
    id: number;
    descripcion: string;
    meses: number[];
    startDate?: string;
    endDate?: string;
    deliverableKey?: string | null;
    deliverableUrl?: string | null;
    deliverableName?: string | null;
    deliverableDescription?: string | null;
    deliverableSubmittedAt?: string | null;
    responsibleUserId?: string | null;
    hoursPerDay?: number | null;
  }[];
  fecha_inicio?: string;
  fecha_fin?: string;
  duration_unit?: string;
  tiempo_estimado?: number;
  tipo_visualizacion?: 'meses' | 'dias';
  dias_necesarios?: number; // <-- Añadido
  dias_estimados?: number; // <-- Añadido
}

// Obtener un proyecto específico por ID, incluyendo objetivos y actividades
export async function getProjectById(
  projectId: number
): Promise<ProjectDetail | null> {
  console.info(`[getProjectById] Called with projectId: ${projectId}`);
  const result = await db
    .select({
      project: projects,
      categoryName: categories.name,
    })
    .from(projects)
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .where(eq(projects.id, projectId))
    .limit(1);

  const project = result[0]?.project;
  const categoryName = result[0]?.categoryName ?? undefined;
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

  const objetivos_especificos = objetivos.map((o) => {
    const actividadesRelacionadas = actividadesConMeses
      .filter((a) => a.objectiveId === o.id)
      .map((a) => ({
        id: a.id,
        descripcion: a.description,
        meses: a.meses,
        startDate: a.startDate
          ? new Date(a.startDate).toISOString()
          : undefined,
        endDate: a.endDate ? new Date(a.endDate).toISOString() : undefined,
        deliverableKey: a.deliverableKey ?? null,
        deliverableUrl: a.deliverableUrl ?? null,
        deliverableName: a.deliverableName ?? null,
        deliverableDescription: a.deliverableDescription ?? null,
        deliverableSubmittedAt: a.deliverableSubmittedAt
          ? new Date(a.deliverableSubmittedAt).toISOString()
          : null,
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
    startDate: a.startDate ? new Date(a.startDate).toISOString() : undefined,
    endDate: a.endDate ? new Date(a.endDate).toISOString() : undefined,
    deliverableKey: a.deliverableKey ?? null,
    deliverableUrl: a.deliverableUrl ?? null,
    deliverableName: a.deliverableName ?? null,
    deliverableDescription: a.deliverableDescription ?? null,
    deliverableSubmittedAt: a.deliverableSubmittedAt
      ? new Date(a.deliverableSubmittedAt).toISOString()
      : null,
    responsibleUserId: a.responsibleUserId ?? null,
    hoursPerDay: a.hoursPerDay ?? null,
  }));

  const projectDetail: ProjectDetail = {
    id: project.id,
    name: project.name ?? 'Untitled Project',
    description: project.description ?? undefined,
    planteamiento: project.planteamiento,
    justificacion: project.justificacion,
    objetivo_general: project.objetivo_general,
    requirements: project.requirements ?? undefined,
    coverImageKey: project.coverImageKey ?? null,
    coverVideoKey: project.coverVideoKey ?? null,
    type_project: project.type_project,
    userId: project.userId,
    categoryId: project.categoryId,
    categoryName,
    isPublic: project.isPublic,
    needsCollaborators: project.needsCollaborators ?? undefined,
    createdAt: project.createdAt
      ? new Date(project.createdAt).toISOString()
      : '',
    updatedAt: project.updatedAt
      ? new Date(project.updatedAt).toISOString()
      : '',
    objetivos_especificos,
    actividades: actividadesSimple,
    fecha_inicio: project.fecha_inicio ?? undefined,
    fecha_fin: project.fecha_fin ?? undefined,
    duration_unit: project.duration_unit ?? undefined,
    tiempo_estimado: project.tiempo_estimado ?? undefined,
    tipo_visualizacion: project.tipo_visualizacion ?? undefined,
    publicComment: false,
    dias_necesarios: project.dias_necesarios ?? undefined, // <-- Añadido
    dias_estimados: project.dias_estimados ?? undefined, // <-- Añadido
  };

  const hasBasicInfo = Boolean(
    projectDetail.name?.trim() &&
    ((projectDetail.description ?? '').trim() ||
      (projectDetail.planteamiento ?? '').trim())
  );
  const hasProblemaJustificacion = Boolean(
    projectDetail.planteamiento?.trim() && projectDetail.justificacion?.trim()
  );
  const hasObjetivoGeneral = Boolean(projectDetail.objetivo_general?.trim());
  const hasRequisitos = (() => {
    if (!projectDetail.requirements) return false;
    try {
      const parsed = JSON.parse(projectDetail.requirements) as unknown;
      return Array.isArray(parsed) && parsed.some((item) => item?.trim?.());
    } catch {
      return false;
    }
  })();
  const hasDuracion = Boolean(
    projectDetail.fecha_inicio && projectDetail.fecha_fin
  );
  const hasObjetivosEspecificos =
    projectDetail.objetivos_especificos.length > 0;
  const hasCronograma = projectDetail.actividades.some(
    (activity) => activity.startDate && activity.endDate
  );

  const completedSections = [
    hasBasicInfo,
    hasProblemaJustificacion,
    hasObjetivoGeneral,
    hasRequisitos,
    hasDuracion,
    hasObjetivosEspecificos,
    hasCronograma,
  ].filter(Boolean).length;

  projectDetail.progressPercentage = Math.round((completedSections / 7) * 100);

  console.info(`[getProjectById] Returning project:`, projectDetail);

  return projectDetail;
}
