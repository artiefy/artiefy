import { type NextRequest, NextResponse } from 'next/server';

import { eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	userActivitiesProgress,
	materias,
	activities,
} from '~/server/db/schema';

interface UpdateGradesRequest {
	courseId: number;
	userId: string;
	activityId: number;
	finalGrade: number;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	try {
		const data = (await request.json()) as UpdateGradesRequest;
		const { courseId, userId, activityId, finalGrade } = data;

		// Update activity progress
		await db
			.insert(userActivitiesProgress)
			.values({
				userId,
				activityId,
				progress: 100,
				isCompleted: true,
				finalGrade,
				lastUpdated: new Date(),
			})
			.onConflictDoUpdate({
				target: [
					userActivitiesProgress.userId,
					userActivitiesProgress.activityId,
				],
				set: {
					finalGrade,
					lastUpdated: new Date(),
				},
			});

		// Get activity parameter info
		const activity = await db.query.activities.findFirst({
			where: eq(activities.id, activityId),
			with: {
				parametro: true,
			},
		});

		if (activity?.parametroId) {
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

			// Update parameter grade
			if (parameterGrade.rows?.[0]?.parameter_grade) {
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
		}

		// Get course materias
		const courseMaterias = await db.query.materias.findMany({
			where: eq(materias.courseid, courseId), // Changed back to courseid
		});

		// Update grades for each materia using SQL
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

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error updating grades:', error);
		return NextResponse.json(
			{ success: false, error: 'Error updating grades' },
			{ status: 500 }
		);
	}
}
