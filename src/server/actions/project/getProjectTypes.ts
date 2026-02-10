'use server';

import { db } from '~/server/db';

/**
 * Obtiene todos los tipos de proyecto activos
 */
export async function getProjectTypes() {
  try {
    const types = await db.query.projectTypes.findMany({
      where: (projectTypes, { eq }) => eq(projectTypes.isActive, true),
      orderBy: (projectTypes, { asc }) => [asc(projectTypes.name)],
    });

    return types;
  } catch (error) {
    console.error('Error al obtener tipos de proyecto:', error);
    return [];
  }
}

/**
 * Obtiene un tipo de proyecto por ID
 */
export async function getProjectTypeById(id: number) {
  try {
    const projectType = await db.query.projectTypes.findFirst({
      where: (projectTypes, { eq }) => eq(projectTypes.id, id),
    });

    return projectType;
  } catch (error) {
    console.error('Error al obtener tipo de proyecto:', error);
    return null;
  }
}
