// /api/enrollments/removeStudent/route.ts
// Permite a staff (admin/educador/super-admin) desmatricular a uno o varios
// estudiantes de un curso.

import { and, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollments, lessons, userLessonsProgress } from '~/server/db/schema';
import { authorizeStaff } from '~/server/utils/apiAuth';

export async function DELETE(req: Request) {
  try {
    const authz = await authorizeStaff();
    if (!authz.ok) {
      return new Response(
        authz.status === 401 ? 'No autorizado' : 'Acceso denegado',
        { status: authz.status }
      );
    }

    const body = (await req.json()) as {
      userId?: string;
      userIds?: string[];
      courseId?: number;
    };

    const userIds = Array.isArray(body.userIds)
      ? body.userIds
      : typeof body.userId === 'string'
        ? [body.userId]
        : [];

    if (userIds.length === 0 || typeof body.courseId !== 'number') {
      return new Response('Invalid input', { status: 400 });
    }
    const courseId = body.courseId;

    const deleted = await db
      .delete(enrollments)
      .where(
        and(
          inArray(enrollments.userId, userIds),
          eq(enrollments.courseId, courseId)
        )
      )
      .returning({ id: enrollments.id, userId: enrollments.userId });

    if (deleted.length === 0) {
      return new Response(
        'Ninguno de los estudiantes está inscrito en este curso',
        { status: 404 }
      );
    }

    const courseLessons = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.courseId, courseId));

    if (courseLessons.length > 0) {
      const removedUserIds = deleted.map((row) => row.userId);
      await db.delete(userLessonsProgress).where(
        and(
          inArray(userLessonsProgress.userId, removedUserIds),
          inArray(
            userLessonsProgress.lessonId,
            courseLessons.map((lesson) => lesson.id)
          )
        )
      );
    }

    return new Response(
      JSON.stringify({ success: true, removed: deleted.length }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing students from course:', error);
    return new Response('Error al desmatricular a los estudiantes del curso', {
      status: 500,
    });
  }
}
