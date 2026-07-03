import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { getForumByCourseId } from '~/models/educatorsModels/forumAndPosts';

export async function GET(req: Request) {
  // Security best practice: forum content is a members-only feature; require an
  // authenticated session so the endpoint cannot be read anonymously.
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const courseId = Number(searchParams.get('courseId'));
  if (isNaN(courseId)) return NextResponse.json(null, { status: 400 });
  const forum = await getForumByCourseId(courseId);
  if (!forum) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(forum);
}
