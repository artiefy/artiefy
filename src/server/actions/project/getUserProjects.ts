'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { categories, projects } from '~/server/db/schema';

// Obtener proyectos propios del usuario
export async function getUserProjects(userId: string) {
  console.log('🔍 getUserProjects called with userId:', userId);

  try {
    const userProjects = await db
      .select({
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
        categoryName: categories.name,
      })
      .from(projects)
      .leftJoin(categories, eq(projects.categoryId, categories.id))
      .where(eq(projects.userId, userId));

    // Transformar los datos para que coincidan con la estructura esperada
    const formattedProjects = userProjects.map((project) => ({
      ...project,
      category: {
        name: project.categoryName,
      },
    }));

    console.log(
      '✅ getUserProjects result:',
      formattedProjects.length,
      'projects found'
    );
    return formattedProjects;
  } catch (error) {
    console.error('❌ Error in getUserProjects:', error);
    throw new Error('No se pudieron obtener los proyectos del usuario');
  }
}
