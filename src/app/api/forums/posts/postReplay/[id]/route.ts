import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import {
	getPostReplyById,
	updatePostReplyById,
} from '~/models/educatorsModels/forumAndPosts';

const respondWithError = (message: string, status: number) =>
	NextResponse.json({ error: message }, { status });

// Actualizar una respuesta
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return respondWithError('No autorizado', 403);
		}

		const replyId = parseInt(params.id);
		if (isNaN(replyId)) {
			return respondWithError('ID de respuesta inválido', 400);
		}

		const body = (await request.json()) as {
			content: string;
		};
		const { content } = body;

		const reply = await getPostReplyById(replyId);
		if (!reply) {
			return respondWithError('Respuesta no encontrada', 404);
		}

		if (reply.userId !== userId) {
			return respondWithError('No autorizado para actualizar esta respuesta', 403);
		}

		await updatePostReplyById(replyId, content);

		return NextResponse.json({ message: 'Respuesta actualizada exitosamente' });
	} catch (error) {
		console.error('Error al actualizar la respuesta:', error);
		return respondWithError('Error al actualizar la respuesta', 500);
	}
}
