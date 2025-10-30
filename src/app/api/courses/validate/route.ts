import { NextResponse } from 'next/server';

import { inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

interface RequestBody {
  courseIds: string; // "381,382,388" format
}

export async function POST(req: Request) {
  try {
    const { courseIds }: RequestBody = await req.json();

    if (!courseIds || typeof courseIds !== 'string') {
      return NextResponse.json({ validIds: [] });
    }

    // Convertir string a array de números
    const ids = courseIds
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json({ validIds: [] });
    }

    // Buscar cursos que existen en la BD
    const existingCourses = await db
      .select({ id: courses.id })
      .from(courses)
      .where(inArray(courses.id, ids));

    const validIds = existingCourses.map((course) => course.id);

    return NextResponse.json({ validIds });
  } catch (error) {
    console.error('Error validating courses:', error);
    return NextResponse.json({ validIds: [] });
  }
}
