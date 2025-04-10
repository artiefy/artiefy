import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface FileSubmissionRequest {
	activityId: number;
	userId: string;
	fileInfo: {
		fileName: string;
		fileUrl: string;
		documentKey: string; // Add this field
		uploadDate: string;
		status: 'pending' | 'reviewed';
		grade?: number; // Add optional grade field
	};
}

export async function POST(request: NextRequest) {
	try {
		// Type-safe request body parsing
		const rawBody: unknown = await request.json();

		if (!isValidFileSubmission(rawBody)) {
			return NextResponse.json(
				{ success: false, error: 'Invalid request format' },
				{ status: 400 }
			);
		}

		// Now TypeScript knows this is a valid FileSubmissionRequest
		const { activityId, userId, fileInfo } = rawBody;

		// Save document key and file info in Upstash
		const submissionKey = `activity:${activityId}:user:${userId}:submission`;
		await redis.set(
			submissionKey,
			{
				...fileInfo,
				documentKey: fileInfo.documentKey, // Store the S3 key
			},
			{ ex: 2592000 }
		); // 30 days TTL

		// Update progress in database with explicit boolean values
		await db
			.insert(userActivitiesProgress)
			.values({
				userId,
				activityId,
				progress: 100,
				isCompleted: true, // Explicit boolean
				lastUpdated: new Date(),
				attemptCount: 1,
				revisada: fileInfo.status === 'reviewed', // Set based on status
				finalGrade: fileInfo.grade ?? null, // Add grade if present
			})
			.onConflictDoUpdate({
				target: [
					userActivitiesProgress.userId,
					userActivitiesProgress.activityId,
				],
				set: {
					progress: 100,
					isCompleted: true, // Explicit boolean
					lastUpdated: new Date(),
					attemptCount: sql`${userActivitiesProgress.attemptCount} + 1`,
					finalGrade: fileInfo.grade ?? null, // Update grade if present
					revisada: fileInfo.status === 'reviewed',
				},
			});

		return NextResponse.json({
			success: true,
			message: 'Archivo subido correctamente',
			documentKey: fileInfo.documentKey,
		});
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido';
		console.error('Error saving file submission:', errorMessage);
		return NextResponse.json(
			{ success: false, error: 'Error al guardar el archivo' },
			{ status: 500 }
		);
	}
}

// Type guard with explicit boolean return
function isValidFileSubmission(data: unknown): data is FileSubmissionRequest {
	if (!data || typeof data !== 'object') return false;

	const submission = data as Partial<FileSubmissionRequest>;

	// Ensure all required properties exist and have correct types
	const hasValidTypes = Boolean(
		typeof submission.activityId === 'number' &&
			typeof submission.userId === 'string' &&
			submission.fileInfo &&
			typeof submission.fileInfo === 'object' &&
			typeof submission.fileInfo.fileName === 'string' &&
			typeof submission.fileInfo.fileUrl === 'string' &&
			typeof submission.fileInfo.documentKey === 'string' &&
			typeof submission.fileInfo.uploadDate === 'string'
	);

	// Separate status check to ensure it's exactly one of the allowed values
	const hasValidStatus = Boolean(
		submission.fileInfo &&
			(submission.fileInfo.status === 'pending' ||
				submission.fileInfo.status === 'reviewed')
	);

	return hasValidTypes && hasValidStatus;
}
