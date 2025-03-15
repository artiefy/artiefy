import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const courseId = searchParams.get('courseId');
		const userId = searchParams.get('userId');

		if (!courseId || !userId) {
			return NextResponse.json(
				{ error: 'Missing required parameters' },
				{ status: 400 }
			);
		}

		// Obtener parámetros y sus notas
		const parameters = await db.query.parametros.findMany({
			where: (param) => eq(param.courseId, parseInt(courseId)),
			with: {
				activities: true,
			},
		});

		const parameterGrades = await db.query.parameterGrades.findMany({
			where: (pg) => eq(pg.userId, userId),
		});

		let totalWeight = 0;
		let weightedSum = 0;
		const parameterSummaries = [];

		// Calcular nota final y resumen de parámetros
		for (const param of parameters) {
			const grade =
				parameterGrades.find((pg) => pg.parameterId === param.id)?.grade ?? 0;
			totalWeight += param.porcentaje;
			weightedSum += grade * param.porcentaje;

			parameterSummaries.push({
				name: param.name,
				grade,
				weight: param.porcentaje,
			});
		}

		const finalGrade = totalWeight > 0 ? weightedSum / totalWeight : 0;

		// Verificar si el curso está completado
		const activities = await db.query.activities.findMany({
			where: (act) => eq(act.lessonsId, parseInt(courseId)),
		});

		const activityProgress = await db.query.userActivitiesProgress.findMany({
			where: (progress) => eq(progress.userId, userId),
		});

		const isCompleted = activities.every((activity) =>
			activityProgress.some(
				(progress) =>
					progress.activityId === activity.id && progress.isCompleted
			)
		);

		return NextResponse.json({
			finalGrade,
			parameters: parameterSummaries,
			isCompleted,
		});
	} catch (error) {
		console.error('Error fetching grade summary:', error);
		return NextResponse.json(
			{ error: 'Error fetching grade summary' },
			{ status: 500 }
		);
	}
}
