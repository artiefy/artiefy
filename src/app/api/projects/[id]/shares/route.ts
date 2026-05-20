import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projects, projectShares } from '~/server/db/schema';

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
      .select({ id: projectShares.id })
      .from(projectShares)
      .where(
        and(
          eq(projectShares.projectId, projectId),
          eq(projectShares.userId, userId)
        )
      )
      .limit(1);

    let action: 'shared' | 'unshared' = 'shared';
    if (existing) {
      await db
        .delete(projectShares)
        .where(
          and(
            eq(projectShares.projectId, projectId),
            eq(projectShares.userId, userId)
          )
        );
      action = 'unshared';
    } else {
      await db.insert(projectShares).values({ projectId, userId });
    }

    const countRows = await db
      .select({ id: projectShares.id })
      .from(projectShares)
      .where(eq(projectShares.projectId, projectId));

    return respond({
      action,
      count: countRows.length,
    });
  } catch (error) {
    console.error('Error POST /api/projects/[id]/shares', error);
    return respond({ error: 'Error interno del servidor' }, 500);
  }
}
