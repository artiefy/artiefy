import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  categories,
  guidedObjectiveActivities,
  guidedObjectives,
  guidedProjects,
  modalidades,
  nivel,
  parametros,
  typeActi,
  userGuidedActivityProgress,
  users,
} from '~/server/db/schema';

export interface GuidedProject {
  id: number;
  title: string;
  description: string | null;
  coverImageKey: string | null;
  coverVideoKey: string | null;
  categoryId: number;
  instructor: string;
  creatorId: string;
  rating: number;
  modalidadId: number;
  nivelId: number;
  courseTypeId: number | null;
  certificationTypeId: number | null;
  individualPrice: number | null;
  requiresProgram: boolean;
  isActive: boolean;
  isTop: boolean;
  isFeatured: boolean;
  visibility: boolean;
  metaPixelId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuidedObjective {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  orderIndex: number;
  coverImageKey: string | null;
  coverVideoKey: string | null;
  resourceKey: string | null;
  resourceNames: string | null;
  guidedProjectId: number;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuidedActivity {
  id: number;
  name: string;
  description: string | null;
  typeId: number;
  objectiveId: number;
  parametroId: number | null;
  porcentaje: number | null;
  startDate: Date | null;
  endDate: Date | null;
  weekNumber: number | null;
  fechaMaximaEntrega: Date | null;
  revisada: boolean;
  lastUpdated: Date;
  instructionVideoKey: string | null;
  instructionText: string | null;
}

// ========== GUIDED PROJECTS CRUD ==========
export const createGuidedProject = async (data: Partial<GuidedProject>) => {
  const [newProject] = await db
    .insert(guidedProjects)
    .values({
      title: data.title || '',
      description: data.description,
      coverImageKey: data.coverImageKey,
      coverVideoKey: data.coverVideoKey,
      categoryId: data.categoryId || 1,
      instructor: data.instructor || '',
      creatorId: data.creatorId || '',
      rating: data.rating || 0,
      modalidadId: data.modalidadId || 1,
      nivelId: data.nivelId || 1,
      courseTypeId: data.courseTypeId,
      certificationTypeId: data.certificationTypeId,
      individualPrice: data.individualPrice,
      requiresProgram: data.requiresProgram || false,
      isActive: data.isActive ?? true,
      isTop: data.isTop || false,
      isFeatured: data.isFeatured || false,
      visibility: data.visibility ?? true,
      metaPixelId: data.metaPixelId,
    })
    .returning();

  return newProject;
};

export const getAllGuidedProjects = async () => {
  return await db
    .select({
      id: guidedProjects.id,
      title: guidedProjects.title,
      description: guidedProjects.description,
      coverImageKey: guidedProjects.coverImageKey,
      coverVideoKey: guidedProjects.coverVideoKey,
      categoryId: guidedProjects.categoryId,
      categoryName: categories.name,
      instructor: guidedProjects.instructor,
      instructorName: users.name,
      creatorId: guidedProjects.creatorId,
      rating: guidedProjects.rating,
      modalidadId: guidedProjects.modalidadId,
      modalidadName: modalidades.name,
      nivelId: guidedProjects.nivelId,
      nivelName: nivel.name,
      courseTypeId: guidedProjects.courseTypeId,
      certificationTypeId: guidedProjects.certificationTypeId,
      isActive: guidedProjects.isActive,
      isTop: guidedProjects.isTop,
      isFeatured: guidedProjects.isFeatured,
      visibility: guidedProjects.visibility,
      createdAt: guidedProjects.createdAt,
      updatedAt: guidedProjects.updatedAt,
    })
    .from(guidedProjects)
    .leftJoin(categories, eq(guidedProjects.categoryId, categories.id))
    .leftJoin(modalidades, eq(guidedProjects.modalidadId, modalidades.id))
    .leftJoin(nivel, eq(guidedProjects.nivelId, nivel.id))
    .leftJoin(users, eq(guidedProjects.instructor, users.id));
};

export const getGuidedProjectById = async (id: number) => {
  const [project] = await db
    .select({
      id: guidedProjects.id,
      title: guidedProjects.title,
      description: guidedProjects.description,
      coverImageKey: guidedProjects.coverImageKey,
      coverVideoKey: guidedProjects.coverVideoKey,
      categoryId: guidedProjects.categoryId,
      categoryName: categories.name,
      instructor: guidedProjects.instructor,
      instructorName: users.name, // 👈 nombre real
      creatorId: guidedProjects.creatorId,
      rating: guidedProjects.rating,
      modalidadId: guidedProjects.modalidadId,
      modalidadName: modalidades.name,
      nivelId: guidedProjects.nivelId,
      nivelName: nivel.name,
      courseTypeId: guidedProjects.courseTypeId,
      certificationTypeId: guidedProjects.certificationTypeId,
      individualPrice: guidedProjects.individualPrice,
      requiresProgram: guidedProjects.requiresProgram,
      isActive: guidedProjects.isActive,
      isTop: guidedProjects.isTop,
      isFeatured: guidedProjects.isFeatured,
      visibility: guidedProjects.visibility,
      metaPixelId: guidedProjects.metaPixelId,
      createdAt: guidedProjects.createdAt,
      updatedAt: guidedProjects.updatedAt,
    })
    .from(guidedProjects)
    .leftJoin(categories, eq(guidedProjects.categoryId, categories.id))
    .leftJoin(modalidades, eq(guidedProjects.modalidadId, modalidades.id))
    .leftJoin(nivel, eq(guidedProjects.nivelId, nivel.id))
    .leftJoin(users, eq(guidedProjects.instructor, users.id))
    .where(eq(guidedProjects.id, id));

  return project;
};

export const getGuidedProjectsByUserId = async (userId: string) => {
  return await db
    .select()
    .from(guidedProjects)
    .where(eq(guidedProjects.creatorId, userId));
};

export const updateGuidedProject = async (
  id: number,
  data: Partial<GuidedProject>
) => {
  const [updated] = await db
    .update(guidedProjects)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(guidedProjects.id, id))
    .returning();

  return updated;
};

export const deleteGuidedProject = async (id: number) => {
  return await db.delete(guidedProjects).where(eq(guidedProjects.id, id));
};

// ========== GUIDED OBJECTIVES CRUD ==========
export const createGuidedObjective = async (data: Partial<GuidedObjective>) => {
  const [newObjective] = await db
    .insert(guidedObjectives)
    .values({
      title: data.title || '',
      description: data.description,
      duration: data.duration || 60,
      orderIndex: data.orderIndex || 0,
      coverImageKey: data.coverImageKey,
      coverVideoKey: data.coverVideoKey,
      resourceKey: data.resourceKey,
      resourceNames: data.resourceNames,
      guidedProjectId: data.guidedProjectId || 1,
      isEnabled: data.isEnabled ?? true,
    })
    .returning();

  return newObjective;
};

export const getObjectivesByProjectId = async (projectId: number) => {
  return await db
    .select()
    .from(guidedObjectives)
    .where(eq(guidedObjectives.guidedProjectId, projectId))
    .orderBy(guidedObjectives.orderIndex);
};

export const getGuidedObjectiveById = async (id: number) => {
  const [objective] = await db
    .select()
    .from(guidedObjectives)
    .where(eq(guidedObjectives.id, id));

  return objective;
};

export const updateGuidedObjective = async (
  id: number,
  data: Partial<GuidedObjective>
) => {
  const [updated] = await db
    .update(guidedObjectives)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(guidedObjectives.id, id))
    .returning();

  return updated;
};

export const deleteGuidedObjective = async (id: number) => {
  return await db.delete(guidedObjectives).where(eq(guidedObjectives.id, id));
};

export const toggleObjectiveEnabled = async (
  id: number,
  isEnabled: boolean
) => {
  const [updated] = await db
    .update(guidedObjectives)
    .set({
      isEnabled,
      updatedAt: new Date(),
    })
    .where(eq(guidedObjectives.id, id))
    .returning();

  return updated;
};

// ========== GUIDED ACTIVITIES CRUD ==========
export const createGuidedActivity = async (data: Partial<GuidedActivity>) => {
  const [newActivity] = await db
    .insert(guidedObjectiveActivities)
    .values({
      name: data.name || '',
      description: data.description,
      typeId: data.typeId || 1,
      objectiveId: data.objectiveId || 1,
      parametroId: data.parametroId,
      porcentaje: data.porcentaje,
      weekNumber: data.weekNumber,
      startDate: data.startDate
        ? new Date(data.startDate).toISOString().split('T')[0]
        : null,
      endDate: data.endDate
        ? new Date(data.endDate).toISOString().split('T')[0]
        : null,
      fechaMaximaEntrega: data.fechaMaximaEntrega
        ? new Date(data.fechaMaximaEntrega) // 👈
        : null,
      revisada: data.revisada || false,
      instructionVideoKey: data.instructionVideoKey,
      instructionText: data.instructionText,
    })
    .returning();

  return newActivity;
};

export const getActivitiesByObjectiveId = async (objectiveId: number) => {
  return await db
    .select({
      id: guidedObjectiveActivities.id,
      name: guidedObjectiveActivities.name,
      description: guidedObjectiveActivities.description,
      typeId: guidedObjectiveActivities.typeId,
      typeName: typeActi.name,
      objectiveId: guidedObjectiveActivities.objectiveId,
      parametroId: guidedObjectiveActivities.parametroId,
      parametroName: parametros.name,
      porcentaje: guidedObjectiveActivities.porcentaje,
      startDate: guidedObjectiveActivities.startDate,
      endDate: guidedObjectiveActivities.endDate,
      weekNumber: guidedObjectiveActivities.weekNumber,
      fechaMaximaEntrega: guidedObjectiveActivities.fechaMaximaEntrega,
      revisada: guidedObjectiveActivities.revisada,
      lastUpdated: guidedObjectiveActivities.lastUpdated,
    })
    .from(guidedObjectiveActivities)
    .leftJoin(typeActi, eq(guidedObjectiveActivities.typeId, typeActi.id))
    .leftJoin(
      parametros,
      eq(guidedObjectiveActivities.parametroId, parametros.id)
    )
    .where(eq(guidedObjectiveActivities.objectiveId, objectiveId));
};

export const getGuidedActivityById = async (id: number) => {
  const [activity] = await db
    .select()
    .from(guidedObjectiveActivities)
    .where(eq(guidedObjectiveActivities.id, id));

  return activity;
};

export const updateGuidedActivity = async (
  id: number,
  data: Partial<GuidedActivity>
) => {
  const updateData = {} as Record<string, unknown>;

  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.typeId) updateData.typeId = data.typeId;
  if (data.parametroId !== undefined) updateData.parametroId = data.parametroId;
  if (data.porcentaje !== undefined) updateData.porcentaje = data.porcentaje;
  if (data.startDate !== undefined) {
    updateData.startDate = data.startDate
      ? new Date(data.startDate).toISOString().split('T')[0]
      : null;
  }
  if (data.endDate !== undefined) {
    updateData.endDate = data.endDate
      ? new Date(data.endDate).toISOString().split('T')[0]
      : null;
  }
  if (data.weekNumber !== undefined) updateData.weekNumber = data.weekNumber;
  if (data.fechaMaximaEntrega !== undefined)
    updateData.fechaMaximaEntrega = data.fechaMaximaEntrega
      ? new Date(data.fechaMaximaEntrega).toISOString().split('T')[0]
      : null;
  if (data.revisada !== undefined) updateData.revisada = data.revisada;
  if (data.instructionVideoKey !== undefined)
    updateData.instructionVideoKey = data.instructionVideoKey;
  if (data.instructionText !== undefined)
    updateData.instructionText = data.instructionText;

  updateData.lastUpdated = new Date();

  const [updated] = await db
    .update(guidedObjectiveActivities)
    .set(updateData as typeof updateData)
    .where(eq(guidedObjectiveActivities.id, id))
    .returning();

  return updated;
};

export const deleteGuidedActivity = async (id: number) => {
  return await db
    .delete(guidedObjectiveActivities)
    .where(eq(guidedObjectiveActivities.id, id));
};

// ========== GUIDED ACTIVITY PROGRESS (entregas/calificaciones) ==========
export const getStudentsProgressForActivity = async (activityId: number) => {
  return await db
    .select({
      userId: userGuidedActivityProgress.userId,
      userName: users.name,
      userEmail: users.email,
      progress: userGuidedActivityProgress.progress,
      isCompleted: userGuidedActivityProgress.isCompleted,
      revisada: userGuidedActivityProgress.revisada,
      attemptCount: userGuidedActivityProgress.attemptCount,
      finalGrade: userGuidedActivityProgress.finalGrade,
      lastAttemptAt: userGuidedActivityProgress.lastAttemptAt,
    })
    .from(userGuidedActivityProgress)
    .leftJoin(users, eq(userGuidedActivityProgress.userId, users.id))
    .where(eq(userGuidedActivityProgress.activityId, activityId));
};

export const updateGuidedActivityProgress = async (
  activityId: number,
  userId: string,
  data: { finalGrade?: number; revisada?: boolean }
) => {
  const updateData = {} as Record<string, unknown>;

  if (data.finalGrade !== undefined) updateData.finalGrade = data.finalGrade;
  if (data.revisada !== undefined) updateData.revisada = data.revisada;
  updateData.lastUpdated = new Date();

  const [updated] = await db
    .update(userGuidedActivityProgress)
    .set(updateData as typeof updateData)
    .where(
      and(
        eq(userGuidedActivityProgress.activityId, activityId),
        eq(userGuidedActivityProgress.userId, userId)
      )
    )
    .returning();

  return updated;
};
