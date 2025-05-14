import { NextResponse } from 'next/server';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

import { db } from '~/server/db';
import { forums, users, courses } from '~/server/db/schema';
import {
	createForum,
	updateForumById,
	deleteForumById,
} from '~/models/educatorsModels/forumAndPosts';

const s3Client = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

async function uploadToS3(file: File, folder: string) {
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	const extension = file.name.split('.').pop();
	const key = `${folder}/${uuidv4()}.${extension}`;

	await s3Client.send(
		new PutObjectCommand({
			Bucket: process.env.AWS_BUCKET_NAME!,
			Key: key,
			Body: buffer,
			ContentType: file.type,
			ACL: 'public-read',
		})
	);

	const fileUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${key}`;
	console.log(`✅ Archivo subido a S3: ${fileUrl}`);
	return key;
}

export async function POST(req: Request) {
	try {
		console.log('📥 Iniciando POST /api/forums');

		const formData = await req.formData();
		console.log('✅ formData recibido');

		const courseId = formData.get('courseId') as string;
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const userId = formData.get('userId') as string;
		const coverImage = formData.get('coverImage') as File | null;
		const documentFile = formData.get('documentFile') as File | null;

		console.log('📝 Datos recibidos:', {
			courseId,
			title,
			description,
			userId,
			coverImage,
			documentFile,
		});

		if (!courseId || !title || !userId) {
			console.error('❌ Falta algún campo obligatorio');
			return NextResponse.json(
				{ message: 'Campos requeridos faltantes' },
				{ status: 400 }
			);
		}

		let coverImageKey = '';
		let documentKey = '';

		// Función para guardar un archivo
		if (coverImage?.name) {
			coverImageKey = await uploadToS3(coverImage, 'forums/images');
		}

		if (documentFile?.name) {
			documentKey = await uploadToS3(documentFile, 'forums/documents');
		}

		// Crear el foro
		const newForum = await createForum(
			Number(courseId),
			title,
			description,
			userId,
			coverImageKey,
			documentKey
		);
		console.log('✅ Foro creado:', newForum);

		// Obtener estudiantes inscritos
		const enrolledStudents = await db.query.enrollments.findMany({
			where: (enrollments, { eq }) =>
				eq(enrollments.courseId, Number(courseId)),
			with: { user: true },
		});

		const studentEmails = enrolledStudents
			.map((enroll) => enroll.user?.email)
			.filter((email) => email && email !== userId);

		console.log('📧 Estudiantes a notificar:', studentEmails);

		// Enviar correos
		if (studentEmails.length > 0) {
			const transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: 'direcciongeneral@artiefy.com',
					pass: process.env.PASS,
				},
			});

			await transporter.sendMail({
				from: '"Foros Artiefy" <direcciongeneral@artiefy.com>',
				to: studentEmails.join(','),
				subject: `📢 Nuevo foro creado: ${title}`,
				html: `
<div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f7f7f7; padding: 20px;">
  <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
    <div style="background-color: #000; padding: 16px 24px;">
      <h1 style="color: #fff; margin: 0;">🖌️ Foro de Artiefy</h1>
    </div>
    <div style="padding: 24px;">
      <h2 style="color: #333;">¡Nuevo foro creado!</h2>
      <p style="color: #444; font-size: 15px;">Se ha creado un nuevo foro en uno de tus cursos:</p>
      <p style="font-size: 16px;"><strong>📌 Título:</strong> ${title}</p>
      <p style="font-size: 16px;"><strong>📘 Descripción:</strong> ${description}</p>
      <div style="margin: 30px 0;">
        <a href="https://artiefy.com/" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; font-weight: 600; text-decoration: none; border-radius: 6px;">
          Ir a Artiefy
        </a>
      </div>
      <p style="font-size: 13px; color: #888;">No respondas directamente a este mensaje. Para más información, visita <a href="https://artiefy.com" style="color: #22c55e;">Artiefy</a>.</p>
    </div>
  </div>
</div>
`,
			});
			console.log('📨 Correos enviados con éxito');
		}

		return NextResponse.json(newForum);
	} catch (error) {
		console.error('❌ Error al crear el foro:', error);
		return NextResponse.json(
			{ message: 'Error interno del servidor', error: String(error) },
			{ status: 500 }
		);
	}
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		void searchParams.get('userId');

		const instructorUser = alias(users, 'instructorUser');

		const results = await db
			.select({
				id: forums.id,
				title: forums.title,
				description: forums.description,
				coverImageKey: forums.coverImageKey,
				documentKey: forums.documentKey,
				course: {
					id: courses.id,
					title: courses.title,
					descripcion: courses.description,
					coverImageKey: courses.coverImageKey,
				},
				instructor: {
					id: instructorUser.id,
					name: instructorUser.name,
				},
				user: {
					id: users.id,
					name: users.name,
				},
			})
			.from(forums)
			.leftJoin(courses, eq(forums.courseId, courses.id))
			.leftJoin(users, eq(forums.userId, users.id))
			.leftJoin(instructorUser, eq(courses.instructor, instructorUser.id));

		return NextResponse.json(
			results.map((forum) => ({
				id: forum.id,
				title: forum.title,
				description: forum.description ?? '',
				coverImageKey: forum.coverImageKey ?? '',
				documentKey: forum.documentKey ?? '',
				course: forum.course,
				user: forum.user,
				instructor: forum.instructor,
			}))
		);
	} catch (error) {
		console.error('Error al obtener los foros:', error);
		return NextResponse.json(
			{ message: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}

export async function PATCH(request: Request) {
	try {
		const body = (await request.json()) as {
			forumId: string;
			title: string;
			description: string;
		};
		const { forumId, title, description } = body;

		await updateForumById(Number(forumId), title, description);
		return NextResponse.json({ message: 'Foro actualizado exitosamente' });
	} catch (error) {
		console.error('Error al actualizar el foro:', error);
		return NextResponse.json(
			{ message: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const url = new URL(request.url);
		const forumId = url.searchParams.get('id'); // Cambiar 'forumId' a 'id'

		if (forumId) {
			await deleteForumById(Number(forumId));
			return NextResponse.json({ message: 'Foro eliminado exitosamente' });
		} else {
			return NextResponse.json(
				{ message: 'Se requiere el ID del foro' },
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error('Error al eliminar el foro:', error);
		return NextResponse.json(
			{ message: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
