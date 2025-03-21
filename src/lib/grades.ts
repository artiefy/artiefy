import { db } from '~/server/db';

import type { GradeReport, ParameterGrade, Activity } from '~/types';

export function calculateWeightedGrade(
	grades: { grade: number; weight: number }[]
): number {
	const weightedSum = grades.reduce(
		(sum, g) => sum + (g.grade * g.weight) / 100,
		0
	);
	return Number(weightedSum.toFixed(1));
}

export async function calculateMateriaGrades(
	userId: string,
	materiaId: number
): Promise<number> {
	const activities = await fetchActivitiesForMateria(materiaId);
	const grades = activities.map((activity) => ({
		grade: activity.finalGrade ?? 0,
		weight: activity.porcentaje ?? 0,
	}));

	return calculateWeightedGrade(grades);
}

export async function calculateParameterGrades(
	userId: string,
	parameterId: number
): Promise<ParameterGrade> {
	const parameter = await db.query.parametros.findFirst({
		where: (parametros, { eq }) => eq(parametros.id, parameterId),
	});

	return {
		id: parameterId,
		parameterId,
		userId,
		parameterName: parameter?.name ?? '',
		grade: 0,
		weight: parameter?.porcentaje ?? 0,
		updatedAt: new Date(),
	};
}

export async function getStudentGradeReport(
	userId: string
): Promise<GradeReport[]> {
	const materias = await db.query.materias.findMany({
		where: (materias, { eq: equals }) =>
			equals(materias.courseid, parseInt(userId, 10)),
	});

	const reports = await Promise.all(
		materias.map(async (materia) => {
			const activities = await fetchActivitiesForMateria(materia.id);
			const grade = await calculateMateriaGrades(userId, materia.id);

			return {
				materiaId: materia.id,
				materiaName: materia.title,
				grade,
				activities: activities.map((a) => ({
					activityId: a.id,
					name: a.name,
					grade: a.finalGrade ?? 0,
					weight: a.porcentaje ?? 0,
				})),
				parameters: [],
			};
		})
	);

	return reports;
}

async function fetchActivitiesForMateria(
	materiaId: number
): Promise<Activity[]> {
	const activities = await db.query.activities.findMany({
		where: (activities, { eq }) => eq(activities.lessonsId, materiaId),
	});

	return activities.map((activity) => ({
		...activity,
		isCompleted: false,
		userProgress: 0,
		attemptLimit: 3,
		currentAttempts: 0,
	}));
}
