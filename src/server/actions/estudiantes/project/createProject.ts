'use server';

import { db } from '~/server/db';
import { projects } from '~/server/db/schema';

// Crear un proyecto
export async function createProject(
  userId: string,
  projectData: {
    name: string;
    description: string;
    courseId: number;
    categoryId: number;
    content: string;
  }
): Promise<void> {
  await db.insert(projects).values({
    name: projectData.name,
    description: projectData.description,
    coverImageKey: null,
    coverVideoKey: null,
    type_project: 'default',
    userId: userId,
    categoryid: projectData.categoryId,
  });
}
