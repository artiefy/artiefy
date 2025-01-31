'use server';

import { eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollments, userLessonsProgress } from '~/server/db/schema';

// Obtener el progreso general del estudiante
export async function getStudentProgress(userId: string): Promise<{
	coursesCompleted: number;
	totalEnrollments: number;
	averageProgress: number;
}> {
	const result = await db
		.select({
			coursesCompleted: sql<number>`COUNT(CASE WHEN ${enrollments.completed} = true THEN 1 END)`,
			totalEnrollments: sql<number>`COUNT(*)`,
			averageProgress: sql<number>`AVG(${userLessonsProgress.progress})`,
		})
		.from(enrollments)
		.leftJoin(
			userLessonsProgress,
			eq(enrollments.userId, userLessonsProgress.userId)
		)
		.where(eq(enrollments.userId, userId))
		.groupBy(enrollments.userId);

	return (
		result?.[0] ?? {
			coursesCompleted: 0,
			totalEnrollments: 0,
			averageProgress: 0,
		}
	);
}
