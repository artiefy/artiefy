import { NextResponse } from 'next/server';

import { clerkClient } from '@clerk/nextjs/server';
import { eq, inArray, and } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollments, users, enrollmentPrograms } from '~/server/db/schema';

const BATCH_SIZE = 100;

export async function POST(request: Request) {
	try {
		// Validate request body
		if (!request.body) {
			return NextResponse.json(
				{ error: 'Missing request body' },
				{ status: 400 }
			);
		}

		const body = (await request.json()) as { courseId?: string; programId?: string; userIds: string[]; planType?: string };
		const { courseId, programId, userIds, planType } = body;

		if (!Array.isArray(userIds) || userIds.length === 0) {
			return NextResponse.json(
				{ error: 'userIds must be a non-empty array' },
				{ status: 400 }
			);
		}

		const parsedCourseId = courseId ? Number(courseId) : undefined;
		const parsedProgramId = programId ? Number(programId) : undefined;

		if (courseId && (parsedCourseId === undefined || isNaN(parsedCourseId))) {
			return NextResponse.json({ error: 'Invalid courseId' }, { status: 400 });
		}

		if (programId && (parsedProgramId === undefined || isNaN(parsedProgramId))) {
			return NextResponse.json({ error: 'Invalid programId' }, { status: 400 });
		}

		if (!parsedCourseId && !parsedProgramId) {
			return NextResponse.json(
				{ error: 'At least one of courseId or programId must be provided' },
				{ status: 400 }
			);
		}

		// Fetch valid users
		const existingUsers = await db
			.select({ id: users.id })
			.from(users)
			.where(inArray(users.id, userIds))
			.execute();

		const validUserIds = new Set(existingUsers.map((u) => u.id));
		const filteredUserIds = userIds.filter((id) => validUserIds.has(id));

		if (filteredUserIds.length === 0) {
			return NextResponse.json(
				{ error: 'No valid users found' },
				{ status: 400 }
			);
		}

		// Enroll in course if courseId is provided
		if (parsedCourseId) {
			const existingEnrollments = await db
				.select({ userId: enrollments.userId })
				.from(enrollments)
				.where(
					and(
						eq(enrollments.courseId, parsedCourseId),
						inArray(enrollments.userId, filteredUserIds)
					)
				)
				.execute();

			const existingUserIds = new Set(existingEnrollments.map((e) => e.userId));
			const newUsers = filteredUserIds.filter((id) => !existingUserIds.has(id));

			if (newUsers.length > 0) {
				await db.insert(enrollments).values(
					newUsers.map((userId) => ({
						userId,
						courseId: parsedCourseId,
						enrolledAt: new Date(),
						completed: false,
					}))
				);
			}
		}

		// Enroll in program if programId is provided
		if (parsedProgramId) {
			const existingProgramEnrollments = await db
				.select({ userId: enrollmentPrograms.userId })
				.from(enrollmentPrograms)
				.where(
					and(
						eq(enrollmentPrograms.programaId, parsedProgramId),
						inArray(enrollmentPrograms.userId, filteredUserIds)
					)
				)
				.execute();

			const existingProgramUserIds = new Set(
				existingProgramEnrollments.map((e) => e.userId)
			);
			const newProgramUsers = filteredUserIds.filter(
				(id) => !existingProgramUserIds.has(id)
			);

			if (newProgramUsers.length > 0) {
				await db.insert(enrollmentPrograms).values(
					newProgramUsers.map((userId) => ({
						userId,
						programaId: parsedProgramId,
						enrolledAt: new Date(),
						completed: false,
					}))
				);
			}
		}

		return NextResponse.json({
			success: true,
			message: 'Enrollment completed successfully',
		});
	} catch (error) {
		console.error('Error in POST /api/enrollments:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
