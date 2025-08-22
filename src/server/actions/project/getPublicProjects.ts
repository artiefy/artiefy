import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projects } from '~/server/db/schema';

export default async function getPublicProjects() {
  try {
    const publicProjects = await db.query.projects.findMany({
      where: eq(projects.isPublic, true),
      with: {
        user: true,
        category: true,
        specificObjectives: true,
      },
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    });

    return publicProjects.map((project) => ({
      id: project.id,
      name: project.name,
      planteamiento: project.planteamiento,
      justificacion: project.justificacion,
      objetivo_general: project.objetivo_general,
      type_project: project.type_project,
      isPublic: project.isPublic,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      coverImageKey: project.coverImageKey,
      coverVideoKey: project.coverVideoKey,
      user: project.user
        ? {
            id: project.user.id,
            name: project.user.name ?? '',
            email: project.user.email ?? '',
          }
        : undefined,
      category: project.category
        ? {
            id: project.category.id,
            name: project.category.name ?? '',
          }
        : undefined,
      objetivosEsp: Array.isArray(project.specificObjectives)
        ? project.specificObjectives.map((obj) => obj.description)
        : [],
      actividades: [],
    }));
  } catch (error) {
    // Agrega log para depuración y lanza el error para que la API lo capture

    console.error('Error en getPublicProjects:', error);
    throw new Error('Error al obtener proyectos públicos');
  }
}
