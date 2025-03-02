import {
	S3Client,
	CreateMultipartUploadCommand,
	AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { v4 as uuidv4 } from 'uuid';

const MAX_SIMPLE_UPLOAD_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB

const client = new S3Client({ region: process.env.AWS_REGION });

export async function POST(request: Request) {
	const { contentType, fileSize } = (await request.json()) as {
		contentType: string;
		fileSize: number;
	};

	try {
		if (!process.env.AWS_BUCKET_NAME) {
			throw new Error('AWS_BUCKET_NAME no está definido');
		}

<<<<<<< HEAD
		const key = `uploads/${uuidv4()}`;
=======
		const key = `uploads/${uuidv4()}`; // Agregamos un prefijo 'uploads/' para mejor organización
>>>>>>> 7c64d4cf64f3b98e5b4933d85649252f79acde49

		if (fileSize > MAX_FILE_SIZE) {
			throw new Error(
				'El archivo es demasiado grande. El tamaño máximo permitido es 1 GB.'
			);
		}

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

			return Response.json({ url, fields, key, uploadType: 'simple' });
		} else {
<<<<<<< HEAD
=======
			// Carga multiparte para archivos grandes (100 MB - 1 GB)
>>>>>>> 7c64d4cf64f3b98e5b4933d85649252f79acde49
			const multipartUpload = await client.send(
				new CreateMultipartUploadCommand({
					Bucket: process.env.AWS_BUCKET_NAME,
					Key: key,
					ContentType: contentType,
<<<<<<< HEAD
					ACL: 'public-read',
=======
					ACL: 'public-read', // Aseguramos que el objeto sea público
>>>>>>> 7c64d4cf64f3b98e5b4933d85649252f79acde49
				})
			);

			return Response.json({
				uploadId: multipartUpload.UploadId,
				key: key,
				uploadType: 'multipart',
			});
		}
	} catch (error) {
		console.error('Error en la carga:', error);
		return Response.json({ error: (error as Error).message }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	const { uploadId, key } = (await request.json()) as {
		uploadId: string;
		key: string;
	};

	try {
		if (!process.env.AWS_BUCKET_NAME) {
			throw new Error('AWS_BUCKET_NAME no está definido');
		}

		await client.send(
			new AbortMultipartUploadCommand({
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: key,
				UploadId: uploadId,
			})
		);

		return Response.json({
			message: 'Carga multiparte abortada con éxito',
		});
	} catch (error) {
		console.error('Error al abortar la carga multiparte:', error);
		return Response.json({ error: (error as Error).message }, { status: 500 });
	}
}
