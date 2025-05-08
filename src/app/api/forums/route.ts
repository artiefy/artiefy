import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import {
	createForum,
	updateForumById,
	deleteForumById,
} from '~/models/educatorsModels/forumAndPosts';
import { db } from '~/server/db';
import { forums, users, courses } from '~/server/db/schema';
import nodemailer from 'nodemailer';
import { alias } from 'drizzle-orm/pg-core';

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const userId = searchParams.get('userId');

		const instructorUser = alias(users, 'instructorUser');

		const query = db
			.select({
				id: forums.id,
				title: forums.title,
				description: forums.description,
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
			.leftJoin(users, eq(forums.userId, users.id)) // autor del foro
			.leftJoin(instructorUser, eq(courses.instructor, instructorUser.id));

		const forumData = userId ? query.where(eq(forums.userId, userId)) : query;

		const results = await forumData;

		return NextResponse.json(
			results.map((forum) => ({
				id: forum.id,
				title: forum.title,
				description: forum.description ?? '',
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

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			courseId: string;
			title: string;
			description: string;
			userId: string;
		};
		const { courseId, title, description, userId } = body;

		const newForum = await createForum(
			Number(courseId),
			title,
			description,
			userId
		);

		// 📨 Buscar estudiantes inscritos y enviar correo
		console.log('[FORO][POST] Buscando estudiantes para notificar...');

		const enrolledStudents = await db.query.enrollments.findMany({
			where: (enrollments, { eq }) =>
				eq(enrollments.courseId, Number(courseId)),
			with: { user: true },
		});

		console.log(
			'[FORO][POST] Estudiantes encontrados:',
			enrolledStudents.length
		);

		const studentEmails = enrolledStudents
			.map((enroll) => enroll.user?.email)
			.filter((email) => email && email !== userId);

		console.log('[FORO][POST] Correos a notificar:', studentEmails);

		if (studentEmails.length > 0) {
			console.log('[FORO][POST] Enviando correo a estudiantes...');

			const transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: 'direcciongeneral@artiefy.com',
					pass: process.env.PASS,
				},
			});

			try {
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
				console.log('[FORO][POST] ✅ Correos enviados correctamente.');
			} catch (error) {
				console.error('[FORO][POST] ❌ Error al enviar el correo:', error);
			}
		} else {
			console.log(
				'[FORO][POST] ⚠️ No hay estudiantes con correo para notificar.'
			);
		}

		return NextResponse.json(newForum);
	} catch (error) {
		console.error('Error al crear el foro:', error);
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
