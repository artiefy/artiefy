'use server';

import { db } from '~/server/db';
import { projects } from '~/server/db/schema';
import type { Project } from '~/types';
import { eq } from 'drizzle-orm';

// Obtener un proyecto específico por ID
export async function getProjectById(
  projectId: number
): Promise<Project | null> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      category: true,
    },
  });

  if (!project) {
    return null;
  }

  return {
    ...project,
    name: project.name ?? 'Untitled Project',
  };
}
