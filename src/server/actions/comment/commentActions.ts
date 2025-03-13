'use server';

import { currentUser } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';

import { isUserEnrolled } from '~/server/actions/courses/enrollInCourse';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function addComment(
	courseId: number,
	content: string,
	rating: number
): Promise<{ success: boolean; message: string }> {
	const user = await currentUser();

	if (!user?.id) {
		throw new Error('Usuario no autenticado');
	}

	const userId = user.id;
	const userName =
		user.username ?? user.emailAddresses[0]?.emailAddress ?? 'Anónimo';

	try {
		const enrolled = await isUserEnrolled(courseId, userId);

		if (!enrolled) {
			return { success: false, message: 'No estás inscrito en este curso' };
		}

		await redis.hmset(
			`comment:${userId}:${courseId}:${new Date().toISOString()}`,
			{
				userId,
				userName,
				courseId,
				content,
				rating,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}
		);

		return { success: true, message: 'Comentario agregado exitosamente' };
	} catch (error: unknown) {
		console.error('Error al agregar comentario:', error);
		if (error instanceof Error) {
			return {
				success: false,
				message: `Error al agregar comentario: ${error.message}`,
			};
		} else {
			return {
				success: false,
				message: 'Error desconocido al agregar comentario',
			};
		}
	}
}

export async function getCommentsByCourseId(
	courseId: number
): Promise<{ comments: Comment[] }> {
	try {
		const keys = await redis.keys(`comment:*:${courseId}:*`);
		const comments = await Promise.all(
			keys.map(async (key) => {
				const comment = await redis.hgetall(key);
				if (!comment) {
					return null;
				}
				return {
					id: key,
					content: comment.content as string,
					rating: Number(comment.rating),
					createdAt: comment.createdAt as string,
					userName: comment.userName as string, // Añadir el nombre del usuario
				};
			})
		);

		return {
			comments: comments.filter(
				(comment): comment is Comment => comment !== null
			),
		};
	} catch (error: unknown) {
		console.error('Error al obtener comentarios:', error);
		return { comments: [] };
	}
}

interface Comment {
	id: string;
	content: string;
	rating: number;
	createdAt: string;
	userName: string;
}
