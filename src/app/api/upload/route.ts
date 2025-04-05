import { NextResponse } from 'next/server';

import {
	DeleteObjectCommand,
	S3Client,
	PutObjectCommand,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const MAX_SIMPLE_UPLOAD_SIZE = 500 * 1024 * 1024; // 500 MB
const MAX_FILE_SIZE = 25 * 1024 * 1024 * 1024; // 25 GB for videos up to 5+ hours

// Simplificamos la creación del cliente S3
const client = new S3Client({ region: process.env.AWS_REGION });

// Agregar función para sanitizar el nombre del archivo
function sanitizeFileName(fileName: string): string {
	// Obtener la extensión del archivo
	const ext = fileName.split('.').pop() ?? '';
	// Generar un timestamp
	const timestamp = Date.now();
	// Crear un nombre base sanitizado (eliminar espacios y caracteres especiales)
	const baseName = fileName
		.split('.')[0]
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '-')
		.replace(/-+/g, '-')
		.trim();

	// Combinar todo con un UUID para garantizar unicidad
	return `${baseName}-${timestamp}-${uuidv4()}.${ext}`;
}

export async function POST(request: Request) {
	try {
		const { contentType, fileSize, fileName } = (await request.json()) as {
			contentType: string;
			fileSize: number;
			fileName: string;
		};

		if (!process.env.AWS_BUCKET_NAME) {
			throw new Error('AWS_BUCKET_NAME no está definido');
		}

		// Sanitize the file name
		const sanitizedFileName = sanitizeFileName(fileName);
		const key = `uploads/${sanitizedFileName}`;

		if (fileSize > MAX_FILE_SIZE) {
			throw new Error(
				'El archivo es demasiado grande. El tamaño máximo permitido es 25 GB.'
			);
		}

		// Handle simple or multipart uploads
		if (fileSize <= MAX_SIMPLE_UPLOAD_SIZE) {
			const { url, fields } = await createPresignedPost(client, {
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: key,
				Conditions: [
					['content-length-range', 0, MAX_SIMPLE_UPLOAD_SIZE],
					['starts-with', '$Content-Type', ''],
				],
				Fields: {
					'Content-Type': contentType,
					acl: 'public-read',
				},
				Expires: 3600,
			});

			return NextResponse.json({
				url,
				fields,
				key,
				fileName: sanitizedFileName,
				uploadType: 'simple',
				contentType,
			});
		} else {
			const command = new PutObjectCommand({
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: key,
				ContentType: contentType,
				ContentLength: fileSize,
				ACL: 'public-read',
			});

			const signedUrl = await getSignedUrl(client, command, {
				expiresIn: 3600,
			});

			return NextResponse.json({
				url: signedUrl,
				key,
				fileName: sanitizedFileName,
				uploadType: 'put',
				contentType,
			});
		}
	} catch (error) {
		console.error('Error en la carga (POST):', error);
		return NextResponse.json(
			{ error: (error as Error).message || 'Error desconocido' },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const body = (await request.json()) as { key: string };
		const { key } = body;

		if (!key) {
			return NextResponse.json(
				{ error: 'Se requiere una key para eliminar el archivo' },
				{ status: 400 }
			);
		}

		if (!process.env.AWS_BUCKET_NAME) {
			throw new Error('AWS_BUCKET_NAME no está definido');
		}

		// Eliminar el archivo específico
		await client.send(
			new DeleteObjectCommand({
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: key,
			})
		);

		return NextResponse.json({
			message: 'Archivo eliminado con éxito',
		});
	} catch (error) {
		console.error('Error al eliminar el archivo:', error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: 'Error desconocido al eliminar el archivo',
			},
			{ status: 500 }
		);
	}
}
