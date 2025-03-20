import { type NextRequest, NextResponse } from 'next/server';

import { auth, currentUser } from '@clerk/nextjs/server';

import {
	createPost,
	deletePostById,
	getPostsByForo,
	getPostById,
} from '~/models/educatorsModels/forumAndPosts';
import { ratelimit } from '~/server/ratelimit/ratelimit';

const respondWithError = (message: string, status: number) =>
	NextResponse.json({ error: message }, { status });

// GET endpoint para obtener posts por foro
export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const foroId = searchParams.get('foroId');

	try {
		const posts = foroId ? await getPostsByForo(Number(foroId)) : [];
		return NextResponse.json(posts);
	} catch (error) {
		console.error('Error:', error);
		return NextResponse.json(
			{ error: 'Error al obtener los posts' },
			{ status: 500 }
		);
	}
}

// POST endpoint para crear posts
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return respondWithError('No autorizado', 403);
		}

		// Implement rate limiting
		const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
		const { success } = await ratelimit.limit(ip);
		if (!success) {
			return respondWithError('Demasiadas solicitudes', 429);
		}

		const clerkUser = await currentUser();
		if (!clerkUser) {
			return respondWithError(
				'No se pudo obtener información del usuario',
				500
			);
		}

		const body = (await request.json()) as {
			content: string;
			foroId: number;
			userId: string;
		};

		const { content, foroId } = body;

		await createPost(foroId, userId, content);

		console.log('Datos enviados al servidor:', {
			content,
			userId,
			foroId,
		});

		return NextResponse.json({ message: 'Post creado exitosamente' });
	} catch (error: unknown) {
		console.error('Error al crear el post:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido';
		return respondWithError(`Error al crear el post: ${errorMessage}`, 500);
	}
}

// Eliminar un post
export async function DELETE(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return respondWithError('No autorizado', 403);
		}

		const { searchParams } = new URL(request.url);
		const postId = searchParams.get('postId');

		if (!postId) {
			return respondWithError('ID no proporcionado', 400);
		}

		const parsedPostId = parseInt(postId);
		const post = await getPostById(parsedPostId);
		if (!post) {
			return respondWithError('Post no encontrado', 404);
		}

		if (post.userId !== userId) {
			return respondWithError('No autorizado para eliminar este post', 403);
		}

		await deletePostById(parsedPostId);
		return NextResponse.json({ message: 'Post eliminado exitosamente' });
	} catch (error) {
		console.error('Error al eliminar el post:', error);
		return respondWithError('Error al eliminar el post', 500);
	}
}
