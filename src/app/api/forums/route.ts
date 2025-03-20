import { NextResponse } from 'next/server';

import {
	createForum,
	updateForumById,
	deleteForumById,
	//getForumByUserId,
	getAllForums,
} from '~/models/educatorsModels/forumAndPosts';

export async function GET() {
// req: Request
	//const { searchParams } = new URL(req.url);
	//const userId = searchParams.get('userId');

	try {
		// if (userId) {
		// 	const forum = await getForumByUserId(userId);
		// 	return NextResponse.json(forum);
		// } else {
		const allForums = await getAllForums();
		return NextResponse.json(allForums);
		//}
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
