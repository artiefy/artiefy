import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectFollows, projects } from '~/server/db/schema';

const respond = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return respond({ followed: false });

    const { id } = await context.params;
    const projectId = Number(id);
    if (!Number.isFinite(projectId)) {
      return respond({ error: 'ID de proyecto inválido' }, 400);
    }

    const [existing] = await db
      .select({ id: projectFollows.id })
      .from(projectFollows)
      .where(
        and(
          eq(projectFollows.projectId, projectId),
          eq(projectFollows.userId, userId)
        )
      )
      .limit(1);

    return respond({ followed: Boolean(existing) });
  } catch (error) {
    console.error('Error GET /api/projects/[id]/follows', error);
    return respond({ error: 'Error interno del servidor' }, 500);
  }
}

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
      .select({ id: projectFollows.id })
      .from(projectFollows)
      .where(
        and(
          eq(projectFollows.projectId, projectId),
          eq(projectFollows.userId, userId)
        )
      )
      .limit(1);

    let action: 'followed' | 'unfollowed' = 'followed';
    if (existing) {
      await db
        .delete(projectFollows)
        .where(
          and(
            eq(projectFollows.projectId, projectId),
            eq(projectFollows.userId, userId)
          )
        );
      action = 'unfollowed';
    } else {
      await db.insert(projectFollows).values({ projectId, userId });
    }

    return respond({
      action,
      followed: action === 'followed',
    });
  } catch (error) {
    console.error('Error POST /api/projects/[id]/follows', error);
    return respond({ error: 'Error interno del servidor' }, 500);
  }
}
