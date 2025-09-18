import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { lessons } from '~/server/db/schema';

export async function GET(request: NextRequest) {
  try {
    // Get the lessonId from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return NextResponse.json(
        { message: 'lessonId is required' },
        { status: 400 }
      );
    }

    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, parseInt(lessonId)),
    });

    if (!lesson) {
      return NextResponse.json(
        { message: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Log what we found for debugging
    console.log(`Lesson ${lessonId} resourceKey:`, lesson.resourceKey);
    console.log(`Lesson ${lessonId} resourceNames:`, lesson.resourceNames);

    // Return raw data from the database to let the frontend handle parsing
    return NextResponse.json({
      resourceKey: lesson.resourceKey,
      resourceNames: lesson.resourceNames,
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
