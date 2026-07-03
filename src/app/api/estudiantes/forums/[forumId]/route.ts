import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { getForumById } from '~/models/super-adminModels/forumAndPosts';

export async function GET(
  _req: Request,
  { params }: { params: { forumId: string } }
) {
  // Security best practice: require an authenticated session to read forum data.
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const forumId = Number(params.forumId);
  if (isNaN(forumId))
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  const forum = await getForumById(forumId);
  if (!forum)
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(forum);
}
