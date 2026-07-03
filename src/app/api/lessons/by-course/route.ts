import { NextResponse } from 'next/server';

import { z } from 'zod';

import { getLessonsByCourseId } from '~/server/actions/estudiantes/lessons/getLessonsByCourseId';
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

  // Security best practice: owner student or staff only.
  const authz = await authorizeOwnerOrStaff(userId);
  if (!authz.ok) {
    return NextResponse.json(
      { error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado' },
      { status: authz.status }
    );
  }

  try {
    const lessons = await getLessonsByCourseId(Number(courseId), userId);
    return NextResponse.json(lessons);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}
