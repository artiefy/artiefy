import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { materiaGrades, parameterGrades } from '~/server/db/schema';

import type { ActivityResults } from '~/types';

interface UpdateGradesRequest {
	courseId: number;
	userId: string;
}

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: NextRequest) {
	try {
		const { courseId, userId } = (await request.json()) as UpdateGradesRequest;

		// Get all activities and their parameters for the course
		const courseActivities = await db.query.activities.findMany({
			where: (activities, { eq }) => eq(activities.lessonsId, courseId),
			with: {
				parametro: true,
				lesson: {
					with: {
						course: true,
					},
				},
			},
		});

		// Group activities by parameter
		const parameterActivities = new Map<
			number,
			{ total: number; completed: number; sum: number }
		>();

		// Calculate parameter completion and grades
		for (const activity of courseActivities) {
			if (!activity.parametroId) continue;

			const resultsKey = `activity:${activity.id}:user:${userId}:results`;
			const results = await redis.get<ActivityResults>(resultsKey);

			if (results?.finalGrade !== undefined) {
				const paramStats = parameterActivities.get(activity.parametroId) ?? {
					total: 0,
					completed: 0,
					sum: 0,
				};

				paramStats.total++;
				paramStats.completed++;
				paramStats.sum += results.finalGrade;
				parameterActivities.set(activity.parametroId, paramStats);
			}
		}

		// Update parameter grades
		for (const [parameterId, stats] of parameterActivities.entries()) {
			if (stats.completed === stats.total) {
				// Only update if all activities are completed
				const parameterGrade = stats.sum / stats.total;

				await db
					.insert(parameterGrades)
					.values({
						parameterId,
						userId,
						grade: parameterGrade,
						updatedAt: new Date(),
					})
					.onConflictDoUpdate({
						target: [parameterGrades.parameterId, parameterGrades.userId],
						set: { grade: parameterGrade, updatedAt: new Date() },
					});
			}
		}

		// Check if all parameters are completed before calculating final grade
		const allParametersCompleted = Array.from(
			parameterActivities.values()
		).every((stats) => stats.completed === stats.total);

		if (allParametersCompleted) {
			// Calculate final course grade
			const parameterGradesList = await db.query.parameterGrades.findMany({
				where: (pg) => eq(pg.userId, userId),
				with: {
					parameter: true,
				},
			});

			let weightedSum = 0;
			let totalWeight = 0;

			// Get parameter details and weights directly from the database
			for (const pg of parameterGradesList) {
				const parameter = await db.query.parametros.findFirst({
					where: (param) => eq(param.id, pg.parameterId),
				});

				if (parameter) {
					weightedSum += pg.grade * parameter.porcentaje;
					totalWeight += parameter.porcentaje;
				}
			}

			const finalGrade = totalWeight > 0 ? weightedSum / totalWeight : 0;

			// Update materia grades only when course is fully completed
			const materias = await db.query.materias.findMany({
				where: (materias, { eq }) => eq(materias.courseid, courseId),
			});

			for (const materia of materias) {
				await db
					.insert(materiaGrades)
					.values({
						materiaId: materia.id,
						userId,
						grade: finalGrade,
						updatedAt: new Date(),
					})
					.onConflictDoUpdate({
						target: [materiaGrades.materiaId, materiaGrades.userId],
						set: { grade: finalGrade, updatedAt: new Date() },
					});
			}

			return NextResponse.json({
				success: true,
				finalGrade,
				courseCompleted: true,
			});
		}

		return NextResponse.json({
			success: true,
			courseCompleted: false,
		});
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido';
		console.error('Error updating grades:', errorMessage);
		return NextResponse.json(
			{ success: false, error: 'Error al actualizar calificaciones' },
			{ status: 500 }
		);
	}
}
