import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { db } from '~/server/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  // Security best practice: derive the identity from the session instead of a
  // client-supplied userId query param, which allowed enumerating any user's
  // enrollment status.
  const { userId } = await auth();
  const { courseId: rawCourseId } = await params;
  const courseId = Number(rawCourseId);
  if (!userId || isNaN(courseId))
    return NextResponse.json({ isEnrolled: false });
  const enrollment = await db.query.enrollments.findFirst({
    where: (enrollments, { eq, and }) =>
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
  });
  return NextResponse.json({ isEnrolled: !!enrollment });
}
