import { type NextRequest, NextResponse } from 'next/server';

import { eq, and, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	lessons,
	materias,
	userActivitiesProgress,
	materiaGrades,
} from '~/server/db/schema';

import type { Materia } from '~/types';

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

		// Get lessons and activities
		const courseLessons = await db.query.lessons.findFirst({
			where: eq(lessons.courseId, parseInt(courseId)),
			with: {
				activities: {
					with: {
						parametro: true,
					},
				},
			},
		});

		if (!courseLessons?.activities) {
			return NextResponse.json(
				{ error: 'No activities found' },
				{ status: 404 }
			);
		}

		// Get activity progress
		const activityIds = courseLessons.activities.map((a) => a.id);
		const progress = await db.query.userActivitiesProgress.findMany({
			where: and(
				eq(userActivitiesProgress.userId, userId),
				inArray(userActivitiesProgress.activityId, activityIds)
			),
		});

		// Calculate grades by parameter
		const parameterGrades = new Map<
			number,
			{ sum: number; count: number; weight: number }
		>();

		courseLessons.activities.forEach((activity) => {
			if (!activity.parametroId) return;

			const activityProgress = progress.find(
				(p) => p.activityId === activity.id
			);
			if (!activityProgress?.isCompleted || !activityProgress.finalGrade)
				return;

			const current = parameterGrades.get(activity.parametroId) ?? {
				sum: 0,
				count: 0,
				weight: activity.parametro?.porcentaje ?? 0,
			};
			current.sum += activityProgress.finalGrade;
			current.count++;
			parameterGrades.set(activity.parametroId, current);
		});

		// Format parameters for response with 1 decimal place
		const parameters = Array.from(parameterGrades.entries()).map(
			([id, data]) => {
				const param = courseLessons.activities.find(
					(a) => a.parametroId === id
				)?.parametro;
				return {
					name: param?.name ?? 'Unknown',
					grade: Number(
						(data.count > 0 ? data.sum / data.count : 0).toFixed(1)
					),
					weight: data.weight,
				};
			}
		);

		// Calculate final grade with 1 decimal place
		const totalWeight = parameters.reduce((sum, p) => sum + p.weight, 0);
		const weightedSum = parameters.reduce(
			(sum, p) => sum + p.grade * p.weight,
			0
		);
		const finalGrade = Number(
			(totalWeight > 0 ? weightedSum / totalWeight : 0).toFixed(1)
		);

		// Update materias grades if there's a final grade
		if (finalGrade > 0) {
			const courseMateriasResult = (await db.query.materias.findMany({
				where: eq(materias.courseid, parseInt(courseId)),
			})) as Materia[];

			// Update grades for each materia
			await Promise.all(
				courseMateriasResult.map(async (materia) => {
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
							set: {
								grade: finalGrade,
								updatedAt: new Date(),
							},
						});
				})
			);
		}

		return NextResponse.json({
			finalGrade,
			parameters,
			isCompleted:
				progress.length === activityIds.length &&
				progress.every((p) => p.isCompleted),
		});
	} catch (error) {
		console.error('Error calculating grades:', error);
		return NextResponse.json(
			{ error: 'Failed to calculate grades' },
			{ status: 500 }
		);
	}
}
