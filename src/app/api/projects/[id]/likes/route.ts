import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectLikes, projects } from '~/server/db/schema';

const respond = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return respond({ error: 'No autorizado' }, 401);

    const { id } = await context.params;
    const projectId = Number(id);
    if (!Number.isFinite(projectId)) {
      return respond({ error: 'ID de proyecto inválido' }, 400);
    }

    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) return respond({ error: 'Proyecto no encontrado' }, 404);

    const [existing] = await db
      .select({ id: projectLikes.id })
      .from(projectLikes)
      .where(
        and(
          eq(projectLikes.projectId, projectId),
          eq(projectLikes.userId, userId)
        )
      )
      .limit(1);

    let action: 'liked' | 'unliked' = 'liked';
    if (existing) {
      await db
        .delete(projectLikes)
        .where(
          and(
            eq(projectLikes.projectId, projectId),
            eq(projectLikes.userId, userId)
          )
        );
      action = 'unliked';
    } else {
      await db.insert(projectLikes).values({ projectId, userId });
    }

    const countRows = await db
      .select({ id: projectLikes.id })
      .from(projectLikes)
      .where(eq(projectLikes.projectId, projectId));

    return respond({
      action,
      count: countRows.length,
    });
  } catch (error) {
    console.error('Error POST /api/projects/[id]/likes', error);
    return respond({ error: 'Error interno del servidor' }, 500);
  }
}
