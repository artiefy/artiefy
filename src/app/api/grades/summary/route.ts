import { type NextRequest, NextResponse } from 'next/server';

import { sql } from 'drizzle-orm';

import { db } from '~/server/db';

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

		// Execute query with proper type casting
		const queryResult = (await db.execute(sql`
      WITH parameter_grades AS (
        SELECT 
          p.id,
          p.name,
          p.porcentaje as weight,
          ROUND(CAST(AVG(uap.final_grade) AS NUMERIC), 1) as grade,
          json_agg(
            json_build_object(
              'id', a.id,
              'name', a.name,
              'grade', uap.final_grade
            )
          ) as activities
        FROM parametros p
        LEFT JOIN activities a ON a.parametro_id = p.id
        LEFT JOIN user_activities_progress uap ON uap.activity_id = a.id 
          AND uap.user_id = ${userId}
        WHERE p.course_id = ${courseId}
        GROUP BY p.id, p.name, p.porcentaje
      )
      SELECT 
        name,
        weight,
        grade,
        activities::text,
        ROUND(CAST(SUM(grade * weight / 100) OVER () AS NUMERIC), 1) as final_grade
      FROM parameter_grades
      ORDER BY id
    `)) as unknown as DBQueryResult;

		// Safely transform results
		const rows = queryResult?.rows ?? [];

		const parameters: GradeParameter[] = rows.map((row) => {
			const activities = JSON.parse(row.activities ?? '[]') as ActivityResult[];

			return {
				name: String(row.name),
				grade: Number(row.grade ?? 0),
				weight: Number(row.weight),
				activities: activities.map((act) => ({
					id: Number(act.id),
					name: String(act.name),
					grade: Number(act.grade),
				})),
			};
		});

		// Get final grade with proper type casting
		const finalGrade = Number(rows[0]?.final_grade ?? 0);

		const response: GradeResponse = {
			finalGrade,
			parameters,
			isCompleted: true,
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
