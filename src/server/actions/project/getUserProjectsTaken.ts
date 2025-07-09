'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { categories, projects, projectsTaken } from '~/server/db/schema';

export async function getUserProjectsTaken(userId: string) {
  console.log('🔍 getUserProjectsTaken called with userId:', userId);

  try {
    const takenProjects = await db
      .select({
        id: projectsTaken.id,
        createdAt: projectsTaken.createdAt,
        projectId: projectsTaken.projectId,
        project: {
          id: projects.id,
          name: projects.name,
          planteamiento: projects.planteamiento,
          justificacion: projects.justificacion,
          objetivo_general: projects.objetivo_general,
          coverImageKey: projects.coverImageKey,
          type_project: projects.type_project,
          userId: projects.userId,
          categoryId: projects.categoryId,
          isPublic: projects.isPublic,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        },
        categoryName: categories.name,
      })
      .from(projectsTaken)
      .leftJoin(projects, eq(projectsTaken.projectId, projects.id))
      .leftJoin(categories, eq(projects.categoryId, categories.id))
      .where(eq(projectsTaken.userId, userId));

    // Transformar los datos para que coincidan con la estructura esperada
    const formattedTakenProjects = takenProjects.map((taken) => ({
      id: taken.id,
      createdAt: taken.createdAt,
      project: taken.project
        ? {
            ...taken.project,
            category: {
              name: taken.categoryName,
            },
          }
        : null,
    }));

    console.log(
      '✅ getUserProjectsTaken result:',
      formattedTakenProjects.length,
      'projects found'
    );
    return formattedTakenProjects;
  } catch (error) {
    console.error('❌ Error in getUserProjectsTaken:', error);
    throw new Error('No se pudieron obtener los proyectos tomados');
  }
}
