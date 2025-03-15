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

export async function POST(request: NextRequest) {
	try {
		const data = (await request.json()) as UpdateGradesRequest;
		const { courseId, userId, activityId, finalGrade } = data;

		// 1. Update activity progress
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

		// 2. Get course materias
		const courseMaterias = await db.query.materias.findMany({
			where: eq(materias.courseid, courseId),
		});

		// 3. Update grades for each materia using SQL
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

		// 4. Update parameter grades if applicable
		const activity = await db.query.activities.findFirst({
			where: eq(activities.id, activityId),
			with: {
				parametro: true,
			},
		});

		if (activity?.parametroId) {
			await db.execute(sql`
        INSERT INTO parameter_grades (parameter_id, user_id, grade, updated_at)
        VALUES (${activity.parametroId}, ${userId}, ${finalGrade}, NOW())
        ON CONFLICT (parameter_id, user_id)
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
