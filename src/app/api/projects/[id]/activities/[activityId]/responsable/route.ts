import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectActivities, projects } from '~/server/db/schema';

export async function PATCH(
  req: Request,
  context: {
    params: Promise<{ id: string; activityId: string }>;
  }
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id, activityId } = await context.params;
    const projectId = Number(id);
    const activityIdNum = Number(activityId);

    if (isNaN(projectId) || isNaN(activityIdNum)) {
      return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 });
    }

    // Check if user is project owner
    const [project] = await db
      .select({ userId: projects.userId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project || project.userId !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { responsibleUserId } = body;

    // Update responsibleUserId for the activity
    const [updated] = await db
      .update(projectActivities)
      .set({ responsibleUserId })
      .where(eq(projectActivities.id, activityIdNum))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Error al actualizar res ponsable' },
      { status: 500 }
    );
  }
}
