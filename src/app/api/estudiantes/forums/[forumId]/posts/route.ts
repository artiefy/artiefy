import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import {
  createPost,
  getForumById,
  getPostsByForo,
} from '~/models/super-adminModels/forumAndPosts';
import { db } from '~/server/db';

export async function GET(
  _req: Request,
  { params }: { params: { forumId: string } }
) {
  const forumId = Number(params.forumId);
  if (isNaN(forumId)) return NextResponse.json([], { status: 400 });
  const posts = await getPostsByForo(forumId);
  return NextResponse.json(posts);
}

export async function POST(
  req: Request,
  { params }: { params: { forumId: string } }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const forumId = Number(params.forumId);
  const body = await req.json();
  // Safe access to content property
  let content = '';
  if (
    body &&
    typeof body === 'object' &&
    Object.prototype.hasOwnProperty.call(body, 'content') &&
    typeof (body as { content?: unknown }).content === 'string'
  ) {
    content = (body as { content: string }).content;
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

  const post = await createPost(forumId, userId, content);
  return NextResponse.json(post);
}
