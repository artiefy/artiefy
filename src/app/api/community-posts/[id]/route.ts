import { NextRequest, NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { communityPosts, projects } from '~/server/db/schema';
import { getApiSession } from '~/server/utils/apiAuth';

const MAX_CONTENT_LENGTH = 2000;

const updatePostSchema = z.object({
  content: z.string().trim().min(1).max(MAX_CONTENT_LENGTH),
  kind: z.enum(['none', 'update', 'milestone', 'request']).default('none'),
  projectId: z.coerce.number().int().positive().optional(),
  imageKey: z.string().trim().min(1).max(1024).optional(),
  linkUrl: z.string().trim().url().max(2048).optional(),
});

const respond = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

async function resolvePostOwner(postId: number) {
  const [post] = await db
    .select({ id: communityPosts.id, userId: communityPosts.userId })
    .from(communityPosts)
    .where(eq(communityPosts.id, postId))
    .limit(1);
  return post ?? null;
}

// PATCH /api/community-posts/[id] — edits a publication. Only the author may
// edit it (never leaked to non-authors: 404 when the post doesn't exist,
// 403 when it exists but belongs to someone else). Accepts the same fields
// as `POST /api/community-posts` and re-validates `projectId` ownership —
// never trusts a previously-selected project without re-checking it.
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession();
    if (!session.userId) return respond({ error: 'No autorizado' }, 401);

    const { id } = await context.params;
    const postId = Number(id);
    if (!Number.isFinite(postId)) {
      return respond({ error: 'ID de publicación inválido' }, 400);
    }

    const post = await resolvePostOwner(postId);
    if (!post) return respond({ error: 'Publicación no encontrada' }, 404);
    if (post.userId !== session.userId) {
      return respond(
        { error: 'No tienes permiso para editar esta publicación' },
        403
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return respond({ error: 'JSON inválido' }, 400);
    }

    const parsed = updatePostSchema.safeParse(rawBody);
    if (!parsed.success) {
      return respond(
        { error: 'Datos inválidos', issues: parsed.error.issues },
        400
      );
    }

    const { content, kind, projectId, imageKey, linkUrl } = parsed.data;

    if (projectId !== undefined) {
      const [project] = await db
        .select({ userId: projects.userId })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project) {
        return respond({ error: 'Proyecto no encontrado' }, 404);
      }
      // Same rule as create: only the owner publishes under a project.
      if (project.userId !== session.userId) {
        return respond(
          { error: 'No tienes permiso para publicar en este proyecto' },
          403
        );
      }
    }

    const [updated] = await db
      .update(communityPosts)
      .set({
        content,
        kind,
        projectId: projectId ?? null,
        imageKey: imageKey ?? null,
        linkUrl: linkUrl ?? null,
      })
      .where(eq(communityPosts.id, postId))
      .returning();

    return respond(updated);
  } catch (error) {
    console.error('[community-posts/[id]][PATCH] error', error);
    return respond({ error: 'Error al editar la publicación' }, 500);
  }
}

// DELETE /api/community-posts/[id] — removes a publication. Only the author
// may delete it; same 404-before-403 never-leak-existence behavior as PATCH.
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession();
    if (!session.userId) return respond({ error: 'No autorizado' }, 401);

    const { id } = await context.params;
    const postId = Number(id);
    if (!Number.isFinite(postId)) {
      return respond({ error: 'ID de publicación inválido' }, 400);
    }

    const post = await resolvePostOwner(postId);
    if (!post) return respond({ error: 'Publicación no encontrada' }, 404);
    if (post.userId !== session.userId) {
      return respond(
        { error: 'No tienes permiso para eliminar esta publicación' },
        403
      );
    }

    await db.delete(communityPosts).where(eq(communityPosts.id, postId));

    return respond({ success: true });
  } catch (error) {
    console.error('[community-posts/[id]][DELETE] error', error);
    return respond({ error: 'Error al eliminar la publicación' }, 500);
  }
}
