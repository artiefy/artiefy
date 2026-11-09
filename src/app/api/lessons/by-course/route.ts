import { NextResponse } from 'next/server';

import { z } from 'zod';

import { getLessonsByCourseId } from '~/server/actions/estudiantes/lessons/getLessonsByCourseId';
import { checkCourseContentAccess } from '~/server/queries/courseContentAccess';
import { authorizeOwnerOrStaff } from '~/server/utils/apiAuth';

const paramsSchema = z.object({
  courseId: z.string(),
  userId: z.string(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  const userId = searchParams.get('userId');

  // Validar que no sean null antes de continuar
  if (!courseId || !userId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const parseResult = paramsSchema.safeParse({ courseId, userId });
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const numericCourseId = Number(courseId);
  if (!Number.isInteger(numericCourseId)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  // Security best practice: owner student or staff only.
  const authz = await authorizeOwnerOrStaff(userId);
  if (!authz.ok) {
    return NextResponse.json(
      { error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado' },
      { status: authz.status }
    );
  }

  // Lessons carry media and resource keys, so the caller must also be
  // entitled to this course's private content (enrolled or owning staff).
  const access = await checkCourseContentAccess(numericCourseId);
  if (!access.ok) {
    return NextResponse.json(
      { error: access.status === 401 ? 'No autorizado' : 'Acceso denegado' },
      { status: access.status }
    );
  }

  try {
    const lessons = await getLessonsByCourseId(numericCourseId, userId);
    return NextResponse.json(lessons);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}
