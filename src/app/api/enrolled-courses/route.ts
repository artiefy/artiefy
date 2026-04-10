import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { getEnrolledCourses } from '~/server/actions/estudiantes/courses/getEnrolledCourses';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ courses: [] }, { status: 200 });
    }

    const courses = await getEnrolledCourses(userId);
    return NextResponse.json({ courses });
  } catch (err) {
    console.error('Error in /api/enrolled-courses:', err);
    return NextResponse.json({ courses: [] }, { status: 500 });
  }
}
