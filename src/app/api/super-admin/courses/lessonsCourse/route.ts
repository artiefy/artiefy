import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { lessons } from '~/server/db/schema';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) {
    return NextResponse.json({ error: 'Falta courseId' }, { status: 400 });
  }

  try {
    const lessonsList = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        description: lessons.description,
        order: lessons.orderIndex,
        resourceKey: lessons.resourceKey,
        resourceNames: lessons.resourceNames,
      })
      .from(lessons)
      .where(eq(lessons.courseId, Number(courseId)))
      .orderBy(lessons.orderIndex);

    return NextResponse.json({ lessons: lessonsList });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
