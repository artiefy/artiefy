import { type NextRequest, NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectActivities, projects } from '~/server/db/schema';
import { authorizeOwnerOrStaff } from '~/server/utils/apiAuth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const { activityId } = await params;
    const { linkUrl } = (await req.json()) as { linkUrl?: string | null };

    if (!activityId) {
      return NextResponse.json(
        { error: 'ID de actividad requerido' },
        { status: 400 }
      );
    }

    const numActivityId = parseInt(activityId);
    if (isNaN(numActivityId)) {
      return NextResponse.json(
        { error: 'ID de actividad inválido' },
        { status: 400 }
      );
    }

    // Security best practice: only the project owner (or staff) may edit this
    // activity's link. Resolve the owning project and authorize before writing.
    const activity = await db
      .select({ projectId: projectActivities.projectId })
      .from(projectActivities)
      .where(eq(projectActivities.id, numActivityId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!activity) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      );
    }

    const project = await db
      .select({ userId: projects.userId })
      .from(projects)
      .where(eq(projects.id, activity.projectId))
      .limit(1)
      .then((rows) => rows[0]);

    const authz = await authorizeOwnerOrStaff(project?.userId);
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado' },
        { status: authz.status }
      );
    }

    // Actualizar el linkUrl de la actividad
    await db
      .update(projectActivities)
      .set({ linkUrl: linkUrl || null })
      .where(eq(projectActivities.id, numActivityId));

    return NextResponse.json(
      { success: true, message: 'Link URL actualizado correctamente' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar el link URL' },
      { status: 500 }
    );
  }
}
