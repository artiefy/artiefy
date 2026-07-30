import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { getForumByGuidedProjectId } from '~/models/educatorsModels/forumAndPosts';
import { getGuidedProjectForumAccess } from '~/server/services/guided-projects/guidedForumAccess';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { projectId: projectIdParam } = await params;
  const projectId = Number(projectIdParam);
  if (isNaN(projectId)) {
    return NextResponse.json(
      { error: 'ID de proyecto inválido' },
      { status: 400 }
    );
  }

  const access = await getGuidedProjectForumAccess({ projectId, userId });
  if (!access.success) {
    const status = access.reason === 'PROJECT_NOT_FOUND' ? 404 : 403;
    return NextResponse.json({ error: 'No autorizado' }, { status });
  }

  const forum = await getForumByGuidedProjectId(projectId);
  if (!forum) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(forum);
}
