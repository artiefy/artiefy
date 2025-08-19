import { NextResponse } from 'next/server';

import { getForumByCourseId } from '~/models/super-adminModels/forumAndPosts';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = Number(searchParams.get('courseId'));
  if (isNaN(courseId)) return NextResponse.json({}, { status: 400 });
  const forum = await getForumByCourseId(courseId);
  if (!forum) return NextResponse.json({}, { status: 404 });
  return NextResponse.json(forum);
}
