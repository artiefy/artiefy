import { NextResponse } from 'next/server';

import { auth, clerkClient } from '@clerk/nextjs/server';

import {
  createPost,
  getForumById,
  getPostsByForo,
} from '~/models/super-adminModels/forumAndPosts';
import { db } from '~/server/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ forumId: string }> }
) {
  const resolvedParams = await params;
  const forumId = Number(resolvedParams.forumId);
  if (isNaN(forumId)) return NextResponse.json([], { status: 400 });
  const posts = await getPostsByForo(forumId);

  // Obtener roles de Clerk para cada usuario
  const postsWithRoles = await Promise.all(
    posts.map(async (post) => {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(post.userId.id);
        const existingRole = (post.userId as { role?: string }).role;
        const role =
          (user?.publicMetadata?.role as string) ??
          existingRole ??
          'estudiante';
        return {
          ...post,
          userId: {
            ...post.userId,
            role,
          },
        };
      } catch {
        return {
          ...post,
          userId: {
            ...post.userId,
            role: (post.userId as { role?: string }).role ?? 'estudiante',
          },
        };
      }
    })
  );

  return NextResponse.json(postsWithRoles);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ forumId: string }> }
) {
  const resolvedParams = await params;
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const forumId = Number(resolvedParams.forumId);
  const body = await req.json();
  // Safe access to content property
  let content = '';
  let imageKey: string | null = null;
  if (
    body &&
    typeof body === 'object' &&
    Object.prototype.hasOwnProperty.call(body, 'content') &&
    typeof (body as { content?: unknown }).content === 'string'
  ) {
    content = (body as { content: string }).content;
  }
  if (
    body &&
    typeof body === 'object' &&
    Object.prototype.hasOwnProperty.call(body, 'imageKey') &&
    typeof (body as { imageKey?: unknown }).imageKey === 'string'
  ) {
    imageKey = (body as { imageKey: string }).imageKey;
  }

  // Verifica inscripción
  const forum = await getForumById(forumId);
  if (!forum)
    return NextResponse.json({ error: 'Foro no encontrado' }, { status: 404 });
  const enrollment = await db.query.enrollments.findFirst({
    where: (enrollments, { eq, and }) =>
      and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, forum.courseId.id)
      ),
  });
  if (!enrollment)
    return NextResponse.json({ error: 'No inscrito' }, { status: 403 });

  const post = await createPost(forumId, userId, content, imageKey);
  return NextResponse.json(post);
}
