'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projects } from '~/server/db/schema';
import { deleteFromS3 } from '~/server/utils/s3'; // Ajusta la ruta según tu estructura

export async function deleteProjectById(projectId: number): Promise<boolean> {
  // Busca el proyecto para obtener la coverImageKey antes de borrar
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  // Borra la imagen de portada en S3 si existe
  if (project?.coverImageKey) {
    try {
      // Elimina el slash inicial si existe
      const s3Key = project.coverImageKey.startsWith('/')
        ? project.coverImageKey.slice(1)
        : project.coverImageKey;
      await deleteFromS3(s3Key);
    } catch (err) {
      console.error(
        'Error deleting project image from S3:',
        err instanceof Error ? err.message : err
      );
    }
  }

  // Si tienes otros archivos relacionados al proyecto, bórralos aquí

  // Borra el proyecto de la base de datos
  const deleted = await db.delete(projects).where(eq(projects.id, projectId));
  return !!deleted;
}
