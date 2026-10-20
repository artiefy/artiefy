import { NextResponse } from 'next/server';

import { and, eq } from 'drizzle-orm';

import {
  parseRepositoryUrl,
  toRepositoryUrl,
} from '~/lib/github/parseRepositoryUrl';
import { db } from '~/server/db';
import { projects } from '~/server/db/schema';
import { getApiSession } from '~/server/utils/apiAuth';

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

/**
 * Links (or unlinks, with `repositoryUrl: null`) the project's GitHub
 * repository. Only the project's owner can change it, and the link is
 * stored in its canonical `https://github.com/owner/repo` form.
 */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = await getApiSession();
  if (!userId) return respondWithError('No autorizado', 401);

  const { id } = await context.params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return respondWithError('ID de proyecto inválido', 400);
  }

  const body = (await req.json().catch(() => ({}))) as {
    repositoryUrl?: unknown;
  };
  let repositoryUrl: string | null = null;
  if (typeof body.repositoryUrl === 'string' && body.repositoryUrl.trim()) {
    const parsed = parseRepositoryUrl(body.repositoryUrl);
    if (!parsed) {
      return respondWithError(
        'El link no parece ser un repositorio válido de GitHub',
        400
      );
    }
    repositoryUrl = toRepositoryUrl(parsed);
  } else if (body.repositoryUrl !== null && body.repositoryUrl !== '') {
    return respondWithError('Falta el link del repositorio', 400);
  }

  const updated = await db
    .update(projects)
    .set({ repositoryUrl, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning({ id: projects.id });

  // Same answer for a missing project and someone else's, so the endpoint
  // does not reveal which project ids exist.
  if (updated.length === 0) {
    return respondWithError('Proyecto no encontrado', 404);
  }
  return NextResponse.json({ repositoryUrl });
}
