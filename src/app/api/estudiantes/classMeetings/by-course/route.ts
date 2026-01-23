import { NextResponse } from 'next/server';

import { getClassMeetingsByCourseId } from '~/server/actions/estudiantes/classMeetings/getClassMeetingsByCourseId';

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

    const meetings = await getClassMeetingsByCourseId(courseId);

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error('Error in /api/estudiantes/classMeetings/by-course:', error);
    return NextResponse.json(
      { error: 'Internal server error', meetings: [] },
      { status: 500 }
    );
  }
}
