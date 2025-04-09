import { type NextRequest, NextResponse } from 'next/server';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Redis } from '@upstash/redis';

import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';

const s3Client = new S3Client({
	region: process.env.AWS_REGION!,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const userId = formData.get('userId') as string;
		const activityId = parseInt(formData.get('activityId') as string);
		const questionId = formData.get('questionId') as string;

		if (!file || !userId || !activityId || !questionId) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		// Generate unique filename with timestamp
		const timestamp = Date.now();
		const fileExt = file.name.split('.').pop();
		const fileName = `activities/${activityId}/${userId}/${questionId}_${timestamp}.${fileExt}`;

		// Upload to S3
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		await s3Client.send(
			new PutObjectCommand({
				Bucket: process.env.AWS_BUCKET_NAME!,
				Key: fileName,
				Body: buffer,
				ContentType: file.type,
			})
		);

		// Store file info in Redis
		const redisKey = `activity:${activityId}:user:${userId}:file`;
		await redis.set(redisKey, {
			s3Key: fileName,
			originalName: file.name,
			uploadedAt: new Date().toISOString(),
			contentType: file.type,
		});

		// Update activity progress in database
		await db
			.insert(userActivitiesProgress)
			.values({
				userId,
				activityId,
				progress: 100,
				isCompleted: false,
				lastUpdated: new Date(),
				revisada: false,
			})
			.onConflictDoUpdate({
				target: [
					userActivitiesProgress.userId,
					userActivitiesProgress.activityId,
				],
				set: {
					progress: 100,
					lastUpdated: new Date(),
					revisada: false,
				},
			});

		return NextResponse.json({
			success: true,
			fileName: file.name,
			s3Key: fileName,
		});
	} catch (error) {
		console.error('Error uploading file:', error);
		return NextResponse.json(
			{ error: 'Error uploading file' },
			{ status: 500 }
		);
	}
}
