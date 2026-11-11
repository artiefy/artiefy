import { type NextRequest, NextResponse } from 'next/server';

import { and, eq, sql } from 'drizzle-orm';

import { sendActivityGradeEmail } from '~/lib/emails/gradeNotification';
import { db } from '~/server/db';
import {
  activities,
  materias,
  userActivitiesProgress,
} from '~/server/db/schema';
import { isCourseOwnedByEducator } from '~/server/queries/educatorCourseAccess';
import { authorizeOwnerOrStaff } from '~/server/utils/apiAuth';

interface UpdateGradesRequest {
  userId: string;
  activityId: number;
  // Ignored: the course is taken from the activity and the grade from the
  // attempt recorded by /api/activities/saveAnswers. Kept for older clients.
  courseId?: number;
  finalGrade?: number;
}

/**
 * Propagates an activity grade to parameter_grades / materia_grades.
 *
 * Its only caller is the student lesson modal, right after saveAnswers. The
 * grade is NOT taken from the request: it is the server-graded finalGrade
 * already stored in user_activities_progress, and the course is the
 * activity's own course, so a student cannot write an arbitrary grade or
 * touch another course's materias.
 */
export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as UpdateGradesRequest;
    const { userId } = data;
    const activityId = Number(data.activityId);

    if (!userId || !Number.isInteger(activityId) || activityId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Security best practice: only the owning student or staff may touch this
    // record.
    const authz = await authorizeOwnerOrStaff(userId);
    if (!authz.ok) {
      return NextResponse.json(
        {
          success: false,
          error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado',
        },
        { status: authz.status }
      );
    }

    const activity = await db.query.activities.findFirst({
      where: eq(activities.id, activityId),
      columns: { id: true, parametroId: true },
      with: { lesson: { columns: { courseId: true } } },
    });

    if (!activity) {
      return NextResponse.json(
        { success: false, error: 'Actividad no encontrada' },
        { status: 404 }
      );
    }

    const courseId = activity.lesson.courseId;

    // An educator may only act on the courses they teach.
    if (
      authz.role === 'educador' &&
      !(await isCourseOwnedByEducator(courseId, authz.userId))
    ) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // 1. The grade is the one recorded server-side for this attempt.
    const progress = await db.query.userActivitiesProgress.findFirst({
      where: and(
        eq(userActivitiesProgress.userId, userId),
        eq(userActivitiesProgress.activityId, activityId)
      ),
      columns: { finalGrade: true },
    });

    const finalGrade = progress?.finalGrade;
    if (typeof finalGrade !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'No hay una calificación registrada para esta actividad',
        },
        { status: 409 }
      );
    }

    // 2. Calcula y actualiza el promedio del parámetro en parameter_grades
    if (activity.parametroId) {
      // Calculate parameter grade based on all activities
      const parameterGrade = await db.execute(sql`
				WITH activity_grades AS (
					SELECT
						a.id,
						COALESCE(uap.final_grade, 0) as grade,
						a.porcentaje as weight
					FROM activities a
					LEFT JOIN user_activities_progress uap
						ON uap.activity_id = a.id
						AND uap.user_id = ${userId}
					WHERE a.parametro_id = ${activity.parametroId}
				)
				SELECT
					CAST(
						SUM(grade * weight) / NULLIF(SUM(weight), 0)
						AS DECIMAL(10,2)
					) as parameter_grade
				FROM activity_grades;
			`);

      // Actualiza la nota del parámetro en parameter_grades
      await db.execute(sql`
				INSERT INTO parameter_grades (parameter_id, user_id, grade, updated_at)
				VALUES (
					${activity.parametroId},
					${userId},
					${parameterGrade.rows[0].parameter_grade},
					NOW()
				)
				ON CONFLICT (parameter_id, user_id)
				DO UPDATE SET
					grade = EXCLUDED.grade,
					updated_at = EXCLUDED.updated_at;
			`);
    }

    // Get course materias
    const courseMaterias = await db.query.materias.findMany({
      where: eq(materias.courseid, courseId), // Changed back to courseid
    });

    // 3. Actualiza la nota final en materia_grades para cada materia del curso
    for (const materia of courseMaterias) {
      await db.execute(sql`
				INSERT INTO materia_grades (materia_id, user_id, grade, updated_at)
				VALUES (${materia.id}, ${userId}, ${finalGrade}, NOW())
				ON CONFLICT (materia_id, user_id)
				DO UPDATE SET
					grade = EXCLUDED.grade,
					updated_at = EXCLUDED.updated_at
			`);
    }

    await sendActivityGradeEmail({ activityId, userId, grade: finalGrade });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error updating grades' },
      { status: 500 }
    );
  }
}
