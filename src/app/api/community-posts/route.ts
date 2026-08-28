import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { communityPosts, projects, users } from '~/server/db/schema';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_CONTENT_LENGTH = 2000;

const createPostSchema = z.object({
  content: z.string().trim().min(1).max(MAX_CONTENT_LENGTH),
  kind: z.enum(['none', 'update', 'milestone', 'request']).default('none'),
  projectId: z.coerce.number().int().positive().optional(),
  imageKey: z.string().trim().min(1).max(1024).optional(),
  linkUrl: z.string().trim().url().max(2048).optional(),
});

const respondWithError = (message: string, status: number, issues?: unknown) =>
  NextResponse.json({ error: message, issues }, { status });

const resolveLimit = (searchParams: URLSearchParams) => {
  const raw = searchParams.get('limit');
  if (!raw) return DEFAULT_LIMIT;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT);
};

// GET /api/community-posts — feed público de publicaciones de la comunidad,
// más recientes primero, con autor y proyecto (cuando aplica) ya resueltos
// para poder renderizar "«autor» publicó en «proyecto»".
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = resolveLimit(searchParams);

    const rows = await db
      .select({
        id: communityPosts.id,
        userId: communityPosts.userId,
        projectId: communityPosts.projectId,
        kind: communityPosts.kind,
        content: communityPosts.content,
        imageKey: communityPosts.imageKey,
        linkUrl: communityPosts.linkUrl,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        authorName: users.name,
        authorEmail: users.email,
        projectName: projects.name,
      })
      .from(communityPosts)
      .innerJoin(users, eq(communityPosts.userId, users.id))
      .leftJoin(projects, eq(communityPosts.projectId, projects.id))
      .orderBy(desc(communityPosts.createdAt))
      .limit(limit);

    const items = rows.map((row) => ({
      id: row.id,
      content: row.content,
      kind: row.kind,
      imageKey: row.imageKey,
      linkUrl: row.linkUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: {
        id: row.userId,
        name: row.authorName,
        email: row.authorEmail,
      },
      project:
        row.projectId !== null
          ? { id: row.projectId, name: row.projectName }
          : null,
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error('[community-posts][GET] error', error);
    return respondWithError('Error al obtener publicaciones', 500);
  }
}

// POST /api/community-posts — crea una publicación de la comunidad.
// `projectId` es opcional: cuando se envía, el usuario debe ser dueño del
// proyecto o el proyecto debe ser público. Nunca se confía en el cliente
// para esta verificación.
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 401);
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return respondWithError('JSON inválido', 400);
    }

    const parsed = createPostSchema.safeParse(rawBody);
    if (!parsed.success) {
      return respondWithError('Datos inválidos', 400, parsed.error.issues);
    }

    const { content, kind, projectId, imageKey, linkUrl } = parsed.data;

    if (projectId !== undefined) {
      const [project] = await db
        .select({ userId: projects.userId })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project) {
        return respondWithError('Proyecto no encontrado', 404);
      }

      // Only the owner publishes under a project. A public project belonging
      // to somebody else is readable, not postable.
      if (project.userId !== userId) {
        return respondWithError(
          'No tienes permiso para publicar en este proyecto',
          403
        );
      }
    }

    const [created] = await db
      .insert(communityPosts)
      .values({
        userId,
        projectId: projectId ?? null,
        kind,
        content,
        imageKey: imageKey ?? null,
        linkUrl: linkUrl ?? null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[community-posts][POST] error', error);
    return respondWithError('Error al crear la publicación', 500);
  }
}
