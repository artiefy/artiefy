import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import {
	getPostRepliesByPostId,
	deletePostReplyById,
	updatePostReplyById,
	getPostReplyById,
	createPostReply,
} from '~/models/educatorsModels/forumAndPosts';

const respondWithError = (message: string, status: number) =>
	NextResponse.json({ error: message }, { status });

// GET endpoint para obtener respuestas de un post
export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const postIds = searchParams.get('postIds');

	if (!postIds) {
		return respondWithError('IDs de los posts no proporcionados', 400);
	}

	try {
		const idsArray = postIds.split(',').map((id) => parseInt(id));
		const replies = await Promise.all(
			idsArray.map(async (id) => {
				const postReplies = await getPostRepliesByPostId(id);
				return postReplies;
			})
		);
		const flattenedReplies = replies.flat();
		return NextResponse.json(flattenedReplies);
	} catch (error) {
		console.error('Error al obtener las respuestas del post:', error);
		return respondWithError('Error al obtener las respuestas del post', 500);
	}
}

// POST endpoint para crear una respuesta
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return respondWithError('No autorizado', 403);
		}

		const body = (await request.json()) as {
			content: string;
			postId: number;
			userId: string;
		};

		const { content, postId } = body;

		await createPostReply(postId, userId, content);

		return NextResponse.json({ message: 'Respuesta creada exitosamente' });
	} catch (error) {
		console.error('Error al crear la respuesta:', error);
		return respondWithError('Error al crear la respuesta', 500);
	}
}

// PUT endpoint para actualizar una respuesta
export async function PUT(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return respondWithError('No autorizado', 403);
		}

		const body = (await request.json()) as {
			id: number;
			content: string;
		};
		const { id, content } = body;

		const reply = await getPostReplyById(id);
		if (!reply) {
			return respondWithError('Respuesta no encontrada', 404);
		}

		if (reply.userId !== userId) {
			return respondWithError(
				'No autorizado para actualizar esta respuesta',
				403
			);
		}

		await updatePostReplyById(id, content);

		return NextResponse.json({ message: 'Respuesta actualizada exitosamente' });
	} catch (error) {
		console.error('Error al actualizar la respuesta:', error);
		return respondWithError('Error al actualizar la respuesta', 500);
	}
}

// DELETE endpoint para eliminar una respuesta
export async function DELETE(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return respondWithError('No autorizado', 403);
		}

		const { searchParams } = new URL(request.url);
		const replyId = searchParams.get('replyId');

		if (!replyId) {
			return respondWithError('ID de la respuesta no proporcionado', 400);
		}

		const parsedReplyId = parseInt(replyId);
		const reply = await getPostReplyById(parsedReplyId);
		if (!reply) {
			return respondWithError('Respuesta no encontrada', 404);
		}

		if (reply.userId !== userId) {
			return respondWithError(
				'No autorizado para eliminar esta respuesta',
				403
			);
		}

		await deletePostReplyById(parsedReplyId);
		return NextResponse.json({ message: 'Respuesta eliminada exitosamente' });
	} catch (error) {
		console.error('Error al eliminar la respuesta:', error);
		return respondWithError('Error al eliminar la respuesta', 500);
	}
}
