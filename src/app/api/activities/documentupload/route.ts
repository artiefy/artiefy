import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface RequestBody {
	filename: string;
	contentType: string;
	activityId: number;
	userId: string;
}

interface DocumentMetadata {
	key: string;
	fileUrl: string;
	fileName: string;
	status: 'pending' | 'reviewed';
	grade?: number;
	feedback?: string;
}

export async function POST(request: Request) {
	try {
		// Parse and validate request body
		const body = (await request.json()) as RequestBody;
		const { filename, contentType, activityId, userId } = body;

		if (!filename || !contentType || !activityId || !userId) {
			return Response.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		// Initialize S3 client with credentials
		const client = new S3Client({
			region: process.env.AWS_REGION,
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
			},
		});

		// Generate unique key for the file
		const key = `documents/${activityId}/${userId}/${uuidv4()}-${filename}`;

		// Create presigned post data
		const { url, fields } = await createPresignedPost(client, {
			Bucket: process.env.AWS_BUCKET_NAME!,
			Key: key,
			Conditions: [
				['content-length-range', 0, 10485760], // 10 MB limit
				['starts-with', '$Content-Type', contentType],
			],
			Fields: {
				acl: 'public-read',
				'Content-Type': contentType,
			},
			Expires: 600, // 10 minutes
		});

		// Store document metadata in Redis
		const documentKey = `document:${activityId}:${userId}`;
		const metadata: DocumentMetadata = {
			key,
			fileUrl: `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${key}`,
			fileName: filename,
			status: 'pending',
		};

		await redis.set(documentKey, metadata);

		// Return presigned URL and fields
		return Response.json({
			url,
			fields,
			key,
			fileUrl: `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${key}`,
		});
	} catch (error) {
		console.error('Document upload error:', error);
		return Response.json({ error: (error as Error).message }, { status: 500 });
	}
}
