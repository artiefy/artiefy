import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import {
	getPostById,
	updatePostById,
} from '~/models/educatorsModels/forumAndPosts';

const respondWithError = (message: string, status: number) =>
	NextResponse.json({ error: message }, { status });

// Actualizar un post
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return respondWithError('No autorizado', 403);
		}

		const postId = parseInt(params.id);
		if (isNaN(postId)) {
			return respondWithError('ID de post inválido', 400);
		}

		const body = (await request.json()) as {
			content: string;
		};
		const { content } = body;

		const post = await getPostById(postId);
		if (!post) {
			return respondWithError('Post no encontrado', 404);
		}

		if (post.userId !== userId) {
			return respondWithError('No autorizado para actualizar este post', 403);
		}

		const updatedContent = `${content}`;
		await updatePostById(postId, updatedContent);

		return NextResponse.json({ message: 'Post actualizado exitosamente' });
	} catch (error) {
		console.error('Error al actualizar el post:', error);
		return respondWithError('Error al actualizar el post', 500);
	}
}
