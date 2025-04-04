import { NextResponse } from 'next/server';

import {
	CreateMultipartUploadCommand,
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
	const { contentType, fileSize, fileName } = (await request.json()) as {
		contentType: string;
		fileSize: number;
		fileName: string;
	};

	try {
		if (!process.env.AWS_BUCKET_NAME) {
			throw new Error('AWS_BUCKET_NAME no está definido');
		}

		// Usar el nombre sanitizado para la key
		const sanitizedFileName = sanitizeFileName(fileName);
		const key = `uploads/${sanitizedFileName}`;

		if (fileSize > MAX_FILE_SIZE) {
			throw new Error(
				'El archivo es demasiado grande. El tamaño máximo permitido es 25 GB.'
			);
		}

		if (fileSize <= MAX_SIMPLE_UPLOAD_SIZE) {
			// Carga simple para archivos pequeños (hasta 500 MB)
			const { url, fields } = await createPresignedPost(client, {
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: key,
				Conditions: [
					['content-length-range', 0, MAX_SIMPLE_UPLOAD_SIZE],
					['starts-with', '$Content-Type', ''],
				],
				Fields: {
					'Content-Type': contentType,
					acl: 'public-read', // Aseguramos que el objeto sea público
				},
				Expires: 3600, // 1 hora
			});

			return NextResponse.json({
				url,
				fields,
				key,
				fileName: sanitizedFileName, // Usar el nombre sanitizado
				uploadType: 'simple',
				contentType, // Add contentType to match structure
			});
		} else if (fileSize < 5 * 1024 * 1024 * 1024) {
			// Usar presigned PUT para archivos hasta 5 GB
			const command = new PutObjectCommand({
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: key,
				ContentType: contentType,
				ContentLength: fileSize, // Add Content-Length
				ACL: 'public-read',
			});

			const signedUrl = await getSignedUrl(client, command, {
				expiresIn: 3600,
			});

			// Return final URL where the file will be accessible
			const finalUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${key}`;

			return NextResponse.json({
				url: signedUrl,
				key,
				fileName: sanitizedFileName, // Usar el nombre sanitizado
				uploadType: 'put',
				contentType,
				fileSize,
				finalUrl, // Add the final URL where the file will be accessible
			});
		} else {
			// Carga multiparte para archivos grandes (5 GB - 25 GB)
			const multipartUpload = await client.send(
				new CreateMultipartUploadCommand({
					Bucket: process.env.AWS_BUCKET_NAME,
					Key: key,
					ContentType: contentType,
					ACL: 'public-read', // Aseguramos que el objeto sea público
				})
			);

			return NextResponse.json({
				uploadId: multipartUpload.UploadId,
				key: key,
				fileName: sanitizedFileName, // Usar el nombre sanitizado
				uploadType: 'multipart',
				url: `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${key}`, // Add additional fields to match simple upload structure
				fields: {},
				contentType, // Add contentType to match structure
			});
		}
	} catch (error) {
		console.error('Error en la carga:', error);
		return NextResponse.json(
			{ error: (error as Error).message },
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
