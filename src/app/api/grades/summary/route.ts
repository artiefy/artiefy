import { type NextRequest, NextResponse } from 'next/server';

import { sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { authorizeOwnerOrStaff } from '~/server/utils/apiAuth';

// Define strict types for query results
interface DBRow {
  [key: string]: unknown;
  name: string;
  weight: number;
  grade: number | null;
  activities: string | null;
  final_grade: number | null;
}

interface DBQueryResult extends Record<string, unknown> {
  rows: DBRow[];
}

interface ActivityResult {
  id: number;
  name: string;
  grade: number;
  weight: number;
}

interface GradeParameter {
  name: string;
  grade: number;
  weight: number;
  activities: ActivityResult[];
}

interface GradeResponse {
  finalGrade: number;
  parameters: GradeParameter[];
  isCompleted: boolean;
  hasParameters: boolean;
  isFullyGraded: boolean;
  totalParameterActivities: number;
  gradedParameterActivities: number;
  ungradedParameterActivities: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');

    if (!courseId || !userId) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      );
    }

    // Security best practice: owner student or staff only.
    const authz = await authorizeOwnerOrStaff(userId);
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado' },
        { status: authz.status }
      );
    }

    const queryResult = (await db.execute(sql`
      WITH parameter_activities AS (
        -- First get all activities and their grades for each parameter
        SELECT 
          p.id as parameter_id,
          p.name as parameter_name,
          p.porcentaje as parameter_weight,
          a.id as activity_id,
          a.name as activity_name,
          a.porcentaje as activity_weight,
          COALESCE(uap.final_grade, 0) as activity_grade
        FROM parametros p
        -- INNER JOIN: a parameter only enters the report and the final grade
        -- once it has at least one activity assigned. Parameters without
        -- activities are excluded entirely (hidden + not calculated).
        INNER JOIN activities a ON a.parametro_id = p.id
        LEFT JOIN user_activities_progress uap
          ON uap.activity_id = a.id
          AND uap.user_id = ${userId}
        WHERE p.course_id = ${courseId}
      ),
      parameter_grades_calc AS (
        -- Then calculate weighted average for each parameter
        SELECT 
          parameter_id,
          parameter_name,
          parameter_weight,
          CAST(
            COALESCE(
              SUM(activity_grade * activity_weight) / NULLIF(SUM(activity_weight), 0),
              0
            ) AS DECIMAL(10,2)
          ) as grade,
          json_agg(
            json_build_object(
              'id', activity_id,
              'name', activity_name,
              'grade', activity_grade,
              'weight', activity_weight
            )
          ) as activities
        FROM parameter_activities
        GROUP BY parameter_id, parameter_name, parameter_weight
      )
      SELECT 
        parameter_name as name,
        parameter_weight as weight,
        grade,
        activities::text,
        -- Weighted average re-normalized over only the parameters that have
        -- activities. When every parameter is assigned (weights sum to 100),
        -- this equals the previous SUM(grade * weight / 100) behavior.
        CAST(
          COALESCE(
            SUM(grade * parameter_weight) OVER ()
              / NULLIF(SUM(parameter_weight) OVER (), 0),
            0
          ) AS DECIMAL(10,2)
        ) as final_grade
      FROM parameter_grades_calc
      ORDER BY parameter_id;
    `)) as unknown as DBQueryResult;

    // Single declaration of rows
    const dbRows = queryResult?.rows ?? [];

    // Transform results with proper type safety
    const parameters: GradeParameter[] = dbRows
      .map((row) => {
        const rawActivities = JSON.parse(row.activities ?? '[]') as {
          id: number | null;
          name: string | null;
          grade: number | null;
          weight: number | null;
        }[];

        // The LEFT JOIN emits a placeholder row (id/name = null) for every
        // parameter that has no linked activity. Drop those so the results
        // view never renders phantom "null" grades.
        const activities: ActivityResult[] = rawActivities
          .filter((act) => act.id !== null && act.name !== null)
          .map((act) => ({
            id: Number(act.id),
            name: String(act.name),
            grade: Number(act.grade ?? 0),
            weight: Number(act.weight ?? 0),
          }));

        return {
          name: String(row.name),
          grade: Number(row.grade ?? 0),
          weight: Number(row.weight),
          activities,
        };
      })
      // Only surface parameters that actually have activities, keeping the
      // results menu in sync with the educator's current activities.
      .filter((param) => param.activities.length > 0);

    // Get final grade with proper type casting
    const finalGrade = Number(dbRows[0]?.final_grade ?? 0);

    const parametersCount = (await db.execute(sql`
      SELECT COUNT(*)::int as count
      FROM parametros
      WHERE course_id = ${courseId}
    `)) as unknown as DBQueryResult;

    const hasParameters = Number(parametersCount.rows?.[0]?.count ?? 0) > 0;

    const parameterActivityStats = (await db.execute(sql`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE uap.final_grade IS NOT NULL)::int as graded,
        COUNT(*) FILTER (WHERE uap.final_grade IS NULL)::int as ungraded
      FROM activities a
      JOIN parametros p ON p.id = a.parametro_id
      LEFT JOIN user_activities_progress uap
        ON uap.activity_id = a.id
        AND uap.user_id = ${userId}
      WHERE p.course_id = ${courseId}
    `)) as unknown as DBQueryResult;

    const totalParameterActivities = Number(
      parameterActivityStats.rows?.[0]?.total ?? 0
    );
    const gradedParameterActivities = Number(
      parameterActivityStats.rows?.[0]?.graded ?? 0
    );
    const ungradedParameterActivities = Number(
      parameterActivityStats.rows?.[0]?.ungraded ?? 0
    );
    const isFullyGraded = hasParameters
      ? totalParameterActivities > 0 && ungradedParameterActivities === 0
      : true;

    // Update materias grades with the correct final grade.
    // This endpoint is polled every 5s by the course and lesson views, so the
    // DO UPDATE is guarded: without the WHERE, every poll rewrote the same
    // value and produced a heap write + WAL record per student per tick. With
    // it, Postgres only writes when the grade actually moved — the stored
    // value ends up identical either way, and `updated_at` now means "when the
    // grade changed" (no consumer reads it; verified across program/materias/
    // certificados, which only select materia_id and grade).
    if (finalGrade > 0) {
      await db.execute(sql`
			  WITH course_materias AS (
				SELECT m.id as materia_id
				FROM materias m
				WHERE m.courseid = ${courseId}
			  )
			  INSERT INTO materia_grades (materia_id, user_id, grade, updated_at)
			  SELECT
				cm.materia_id,
				${userId},
				${finalGrade},
				NOW()
			  FROM course_materias cm
			  ON CONFLICT (materia_id, user_id)
			  DO UPDATE SET
				grade = EXCLUDED.grade,
				updated_at = EXCLUDED.updated_at
			  WHERE materia_grades.grade IS DISTINCT FROM EXCLUDED.grade
			`);
    }

    const response: GradeResponse = {
      finalGrade,
      parameters,
      isCompleted: true,
      hasParameters,
      isFullyGraded,
      totalParameterActivities,
      gradedParameterActivities,
      ungradedParameterActivities,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error calculating grades:', error);
    return NextResponse.json(
      { error: 'Failed to calculate grades' },
      { status: 500 }
    );
  }
}
