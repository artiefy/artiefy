import { NextResponse } from 'next/server';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { auth } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';

import { updateLesson } from '~/models/educatorsModels/lessonsModels';
import { sanitizeFileName } from '~/utils/s3Utils';

const client = new S3Client({ region: process.env.AWS_REGION });

export async function POST(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as Blob;
		const lessonId = formData.get('lessonId');

		if (!file || !lessonId) {
			return NextResponse.json(
				{ error: 'Archivo o ID de lección faltante' },
				{ status: 400 }
			);
		}

		// Convert the file to a buffer
		const buffer = Buffer.from(await file.arrayBuffer());
		const sanitizedFileName = sanitizeFileName(`video-${uuidv4()}.mp4`);
		const key = `uploads/${sanitizedFileName}`;

		// Upload the file to S3
		await client.send(
			new PutObjectCommand({
				Bucket: process.env.AWS_BUCKET_NAME!,
				Key: key,
				Body: buffer,
				ContentType: 'video/mp4',
				ACL: 'public-read',
			})
		);

		// Update the lesson with the video key
		await updateLesson(Number(lessonId), { coverVideoKey: key });

		
		return NextResponse.json({
			message: 'Video subido y lección actualizada',
			key,
		});
	} catch (error) {
		console.error('Error al subir el video en el backend:', error);
		return NextResponse.json(
			{ error: 'Error en la carga del video' },
			{ status: 500 }
		);
	}
}
