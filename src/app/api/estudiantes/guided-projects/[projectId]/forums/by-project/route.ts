import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { getForumsByGuidedProjectId } from '~/models/educatorsModels/forumAndPosts';
import { getGuidedProjectForumAccess } from '~/server/services/guided-projects/guidedForumAccess';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { projectId: projectIdParam } = await params;
    const projectId = Number(projectIdParam);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json(
        { error: 'ID de proyecto inválido' },
        { status: 400 }
      );
    }

    const access = await getGuidedProjectForumAccess({ projectId, userId });
    if (!access.success) {
      const status = access.reason === 'PROJECT_NOT_FOUND' ? 404 : 403;
      return NextResponse.json(
        {
          error: status === 404 ? 'Proyecto no encontrado' : 'No autorizado',
        },
        { status }
      );
    }

    const projectForums = await getForumsByGuidedProjectId(projectId);
    return NextResponse.json(projectForums);
  } catch (error) {
    console.error('Error loading guided project forums:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los foros' },
      { status: 500 }
    );
  }
}
