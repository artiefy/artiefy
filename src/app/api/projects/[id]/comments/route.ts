import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectComments, projects, users } from '~/server/db/schema';

const respond = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

const toAvatarUrl = (profileImageKey?: string | null) => {
  if (!profileImageKey) return null;
  if (
    profileImageKey.startsWith('http://') ||
    profileImageKey.startsWith('https://')
  ) {
    return profileImageKey;
  }
  const bucket = process.env.NEXT_PUBLIC_AWS_S3_URL;
  if (!bucket) return null;
  return `${bucket}/${profileImageKey}`;
};

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
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

    const comments = await db
      .select({
        id: projectComments.id,
        content: projectComments.content,
        createdAt: projectComments.createdAt,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        profileImageKey: users.profileImageKey,
      })
      .from(projectComments)
      .innerJoin(users, eq(projectComments.userId, users.id))
      .where(eq(projectComments.projectId, projectId))
      .orderBy(desc(projectComments.createdAt));

    return respond({
      comments: comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: comment.userId,
          name: comment.userName?.trim() || comment.userEmail,
          avatarUrl: toAvatarUrl(comment.profileImageKey),
        },
      })),
    });
  } catch (error) {
    console.error('Error GET /api/projects/[id]/comments', error);
    return respond({ error: 'Error interno del servidor' }, 500);
  }
}

export async function POST(
  req: NextRequest,
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

    const body = (await req.json()) as { content?: string };
    const content = body.content?.trim() ?? '';
    if (!content) {
      return respond({ error: 'El comentario no puede estar vacío' }, 400);
    }
    if (content.length > 800) {
      return respond({ error: 'El comentario excede 800 caracteres' }, 400);
    }

    const [created] = await db
      .insert(projectComments)
      .values({
        projectId,
        userId,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: projectComments.id,
        content: projectComments.content,
        createdAt: projectComments.createdAt,
      });

    const [author] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        profileImageKey: users.profileImageKey,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return respond({
      comment: {
        id: created.id,
        content: created.content,
        createdAt: created.createdAt,
        user: {
          id: author?.id ?? userId,
          name: author?.name?.trim() || author?.email || 'Usuario',
          avatarUrl: toAvatarUrl(author?.profileImageKey),
        },
      },
    });
  } catch (error) {
    console.error('Error POST /api/projects/[id]/comments', error);
    return respond({ error: 'Error interno del servidor' }, 500);
  }
}
