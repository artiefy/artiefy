import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import {
	createForum,
	updateForumById,
	deleteForumById,
} from '~/models/educatorsModels/forumAndPosts';
import { db } from '~/server/db';
import { forums, users, courses } from '~/server/db/schema';


export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const userId = searchParams.get('userId');

		const query = db
			.select({
				id: forums.id,
				title: forums.title,
				description: forums.description,
				course: {
					id: courses.id,
					title: courses.title,
					descripcion: courses.description,
					instructor: courses.instructor,
					coverImageKey: courses.coverImageKey,
				},
				user: {
					id: users.id,
					name: users.name,
				},
			})
			.from(forums)
			.leftJoin(courses, eq(forums.courseId, courses.id))
			.leftJoin(users, eq(forums.userId, users.id));

		const forumData = userId
			? query.where(eq(forums.userId, userId))
			: query;

		const results = await forumData;

		return NextResponse.json(
			results.map((forum) => ({
				id: forum.id,
				title: forum.title,
				description: forum.description ?? '',
				course: forum.course,
				user: forum.user,
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
