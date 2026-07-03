import { NextResponse } from 'next/server';

import { getAllCourses } from '~/server/actions/estudiantes/courses/getAllCourses';

export const maxDuration = 60;

export async function GET() {
  try {
    const courses = await getAllCourses();
    return NextResponse.json(courses);
  } catch {
    return NextResponse.json(
      { error: 'Error fetching courses' },
      { status: 500 }
    );
  }
}
