import {
	CreateMultipartUploadCommand,
	DeleteObjectCommand,
	ListObjectsV2Command,
	S3Client,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const MAX_SIMPLE_UPLOAD_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB

// Simplificamos la creación del cliente S3
const client = new S3Client({ region: process.env.AWS_REGION });

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
		const key = `uploads/${uuidv4()}-${fileName}`; // Agregamos un prefijo 'uploads/' para mejor organización

		if (fileSize > MAX_FILE_SIZE) {
			throw new Error(
				'El archivo es demasiado grande. El tamaño máximo permitido es 1 GB.'
			);
		}

		if (fileSize <= MAX_SIMPLE_UPLOAD_SIZE) {
			// Carga simple para archivos pequeños (hasta 100 MB)
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
				fileName,
				uploadType: 'simple',
			});
		} else {
			// Carga multiparte para archivos grandes (100 MB - 1 GB)
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
				fileName: fileName,
				uploadType: 'multipart',
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
	const { key, fileName } = (await request.json()) as {
		key: string;
		fileName?: string;
	};

	try {
		if (!process.env.AWS_BUCKET_NAME) {
			throw new Error('AWS_BUCKET_NAME no está definido');
		}

		// Si se proporciona fileName, eliminar el archivo específico
		if (fileName) {
			const specificKey = `uploads/${fileName}`;
			await client.send(
				new DeleteObjectCommand({
					Bucket: process.env.AWS_BUCKET_NAME,
					Key: specificKey,
				})
			);
		} else {
			// Si no se proporciona fileName, eliminar todos los archivos que coincidan con la clave
			const listObjectsResponse = await client.send(
				new ListObjectsV2Command({
					Bucket: process.env.AWS_BUCKET_NAME,
					Prefix: key,
				})
			);

			const deletePromises = listObjectsResponse.Contents?.map((object) =>
				client.send(
					new DeleteObjectCommand({
						Bucket: process.env.AWS_BUCKET_NAME,
						Key: object.Key!,
					})
				)
			);

			if (deletePromises) {
				await Promise.all(deletePromises);
			}
		}

		return NextResponse.json({
			message: 'Archivo(s) eliminado(s) con éxito',
		});
	} catch (error) {
		console.error('Error al eliminar el archivo:', error);
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 500 }
		);
	}
}
