import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { getForumByCourseId } from '~/models/educatorsModels/forumAndPosts';
import { getCourseForumAccess } from '~/server/services/forums/courseForumAccess';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const courseId = Number(searchParams.get('courseId'));
    if (!Number.isInteger(courseId) || courseId <= 0) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    const access = await getCourseForumAccess({ courseId, userId });
    if (!access.success) {
      const status = access.reason === 'COURSE_NOT_FOUND' ? 404 : 403;
      return NextResponse.json(
        {
          error: status === 404 ? 'Curso no encontrado' : 'No autorizado',
        },
        { status }
      );
    }

    const forum = await getForumByCourseId(courseId);
    return NextResponse.json(forum);
  } catch (error) {
    console.error('Error loading course forum:', error);
    return NextResponse.json(
      { error: 'No se pudo cargar el foro' },
      { status: 500 }
    );
  }
}
