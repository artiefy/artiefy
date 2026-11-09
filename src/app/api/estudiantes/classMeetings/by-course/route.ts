import { NextResponse } from 'next/server';

import { getClassMeetingsByCourseId } from '~/server/actions/estudiantes/classMeetings/getClassMeetingsByCourseId';
import { checkCourseContentAccess } from '~/server/queries/courseContentAccess';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseIdParam = searchParams.get('courseId');

    if (!courseIdParam) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      );
    }

    const courseId = parseInt(courseIdParam, 10);

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'courseId must be a valid number' },
        { status: 400 }
      );
    }

    // Class meetings carry join links and recording keys.
    const access = await checkCourseContentAccess(courseId);
    if (!access.ok) {
      return NextResponse.json(
        {
          error: access.status === 401 ? 'No autorizado' : 'Acceso denegado',
          meetings: [],
        },
        { status: access.status }
      );
    }

    const meetings = await getClassMeetingsByCourseId(courseId);

    return NextResponse.json({ meetings });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error', meetings: [] },
      { status: 500 }
    );
  }
}
