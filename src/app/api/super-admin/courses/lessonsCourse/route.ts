import { NextResponse } from 'next/server';

import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollments, lessons } from '~/server/db/schema';
import { isCourseOwnedByEducator } from '~/server/queries/educatorCourseAccess';
import { getApiSession } from '~/server/utils/apiAuth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) {
    return NextResponse.json({ error: 'Falta courseId' }, { status: 400 });
  }

  const courseIdNumber = Number(courseId);
  if (!Number.isInteger(courseIdNumber)) {
    return NextResponse.json({ error: 'courseId inválido' }, { status: 400 });
  }

  // Resource keys are private: signed-in staff (educators only for their own
  // courses) or students enrolled in the course.
  const session = await getApiSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let allowed = session.role === 'admin' || session.role === 'super-admin';
  if (!allowed && session.role === 'educador') {
    allowed = await isCourseOwnedByEducator(courseIdNumber, session.userId);
  }
  if (!allowed && !session.isStaff) {
    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, session.userId),
          eq(enrollments.courseId, courseIdNumber)
        )
      )
      .limit(1);
    allowed = Boolean(enrollment);
  }
  if (!allowed) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
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
      .where(eq(lessons.courseId, courseIdNumber))
      .orderBy(lessons.orderIndex);

    return NextResponse.json({ lessons: lessonsList });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
