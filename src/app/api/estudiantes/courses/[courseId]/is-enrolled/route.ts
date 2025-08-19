import { NextResponse } from 'next/server';

import { db } from '~/server/db';

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const courseId = Number(params.courseId);
  if (!userId || isNaN(courseId))
    return NextResponse.json({ isEnrolled: false });
  const enrollment = await db.query.enrollments.findFirst({
    where: (enrollments, { eq, and }) =>
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
  });
  return NextResponse.json({ isEnrolled: !!enrollment });
}
