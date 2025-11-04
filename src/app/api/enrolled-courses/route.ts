import { NextResponse } from 'next/server';

import { getEnrolledCourses } from '~/server/actions/estudiantes/courses/getEnrolledCourses';

export async function GET() {
  try {
    const courses = await getEnrolledCourses();
    return NextResponse.json({ courses });
  } catch (err) {
    console.error('Error in /api/enrolled-courses:', err);
    return NextResponse.json({ courses: [] }, { status: 500 });
  }
}
