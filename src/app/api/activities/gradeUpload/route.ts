import { type NextRequest, NextResponse } from 'next/server';

import { eq, and } from 'drizzle-orm';

import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';

interface GradeRequest {
	activityId: number;
	userId: string;
	grade: number;
}

export async function POST(request: NextRequest) {
	try {
		const data = (await request.json()) as GradeRequest;
		const { activityId, userId, grade } = data;

		await db
			.update(userActivitiesProgress)
			.set({
				finalGrade: grade,
				isCompleted: true,
				revisada: true,
				lastUpdated: new Date(),
			})
			.where(
				and(
					eq(userActivitiesProgress.activityId, activityId),
					eq(userActivitiesProgress.userId, userId)
				)
			);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error grading upload:', error);
		return NextResponse.json(
			{ error: 'Error grading upload' },
			{ status: 500 }
		);
	}
}
