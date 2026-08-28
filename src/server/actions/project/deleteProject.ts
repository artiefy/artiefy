'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  projectInvitations,
  projectParticipationRequests,
  projects,
  projectsTaken,
} from '~/server/db/schema';
import { deleteS3File } from '~/utils/s3Utils';

export default async function deleteProject(projectId: number, userId: string) {
  try {
    // Primero obtener el proyecto para verificar permisos y obtener el coverImageKey
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    // Verificar que el usuario sea el propietario del proyecto
    if (project.userId !== userId) {
      throw new Error('No tienes permisos para eliminar este proyecto');
    }

    // Eliminar archivo de S3 si existe
    if (project.coverImageKey) {
      try {
        await deleteS3File(project.coverImageKey);
      } catch (error) {
        console.error('Error eliminando archivo de S3:', error);
        // Continuar con la eliminación del proyecto aunque falle la eliminación del archivo
      }
    }

    // Nine of the thirteen foreign keys pointing at `projects.id` cascade, but
    // `projects_taken`, `project_invitations` and `project_participation_requests`
    // are NO ACTION, so a project with a collaborator, an invitation or a pending
    // request would fail the delete with a foreign-key violation. Clear those
    // three first, in one atomic batch with the project itself.
    await db.batch([
      db.delete(projectsTaken).where(eq(projectsTaken.projectId, projectId)),
      db
        .delete(projectInvitations)
        .where(eq(projectInvitations.projectId, projectId)),
      db
        .delete(projectParticipationRequests)
        .where(eq(projectParticipationRequests.projectId, projectId)),
      db.delete(projects).where(eq(projects.id, projectId)),
    ]);

    return { success: true, message: 'Proyecto eliminado exitosamente' };
  } catch (error) {
    console.error('Error en deleteProject:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Error al eliminar proyecto'
    );
  }
}
