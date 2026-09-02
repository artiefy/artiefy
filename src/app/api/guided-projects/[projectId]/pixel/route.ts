import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { guidedProjects } from '~/server/db/schema';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const parsedProjectId = Number(projectId);

    if (!Number.isInteger(parsedProjectId)) {
      return NextResponse.json({ metaPixelId: null }, { status: 400 });
    }

    console.log(
      '📡 API: Consultando pixel para proyecto guiado ID:',
      parsedProjectId
    );

    const [project] = await db
      .select({
        title: guidedProjects.title,
        metaPixelId: guidedProjects.metaPixelId,
      })
      .from(guidedProjects)
      .where(eq(guidedProjects.id, parsedProjectId))
      .limit(1);

    if (!project) {
      console.log('❌ API: Proyecto guiado no encontrado');
      return NextResponse.json({ metaPixelId: null }, { status: 404 });
    }

    console.log('✅ API: Pixel encontrado:', project.metaPixelId);
    return NextResponse.json({
      metaPixelId: project.metaPixelId ?? null,
      title: project.title,
    });
  } catch (error) {
    console.error('❌ API: Error fetching guided project pixel:', error);
    return NextResponse.json({ metaPixelId: null }, { status: 500 });
  }
}
