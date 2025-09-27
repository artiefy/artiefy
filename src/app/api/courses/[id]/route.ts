import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!id) {
      return NextResponse.json(
        { error: 'Course id inválido' },
        { status: 400 }
      );
    }

    const [course] = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
      })
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);

    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (err) {
    console.error('Error fetching course details:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
