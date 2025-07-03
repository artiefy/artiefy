/* 'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projects } from '~/server/db/schema';
import { type Project } from '~/types';

// Obtener un proyecto específico por ID
export async function getProjectById(
  projectId: number
): Promise<Project | null> {
  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  const project = result[0];

  if (!project) {
    return null;
  }

  return {
    ...project,
    name: project.name ?? 'Untitled Project',
  };
}
 */