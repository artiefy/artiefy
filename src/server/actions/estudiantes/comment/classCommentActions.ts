'use server';

import { currentUser } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function addClassComment(
  lessonId: number,
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
    const commentId = `class_comment:${userId}:${lessonId}:${new Date().toISOString()}`;
    await redis.hmset(commentId, {
      userId,
      userName,
      lessonId,
      content,
      rating,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
    });

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

export async function getCommentsByLessonId(
  lessonId: number
): Promise<{ comments: ClassComment[] }> {
  try {
    const user = await currentUser();
    const userId = user?.id;

    const keys = await redis.keys(`class_comment:*:${lessonId}:*`);
    const comments = await Promise.all(
      keys.map(async (key) => {
        const comment = await redis.hgetall(key);
        if (!comment) {
          return null;
        }
        const userLiked = userId
          ? await redis.exists(`class_like:${userId}:${key}`)
          : false;
        return {
          id: key,
          content: comment.content as string,
          rating: Number(comment.rating),
          createdAt: comment.createdAt as string,
          userName: comment.userName as string,
          likes: Number(comment.likes),
          userId: comment.userId as string,
          userLiked: Boolean(userLiked),
        };
      })
    );

    const sortedComments = comments
      .filter((comment): comment is ClassComment => comment !== null)
      .sort((a, b) => b.likes - a.likes);

    return { comments: sortedComments };
  } catch (error: unknown) {
    console.error('Error al obtener comentarios:', error);
    return { comments: [] };
  }
}

export async function editClassComment(
  commentId: string,
  content: string,
  rating: number
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await currentUser();

    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    const comment = await redis.hgetall(commentId);

    if (!comment || comment.userId !== user.id) {
      return {
        success: false,
        message: 'No tienes permiso para editar este comentario',
      };
    }

    await redis.hmset(commentId, {
      content,
      rating,
      updatedAt: new Date().toISOString(),
    });

    return { success: true, message: 'Comentario editado exitosamente' };
  } catch (error: unknown) {
    console.error('Error al editar comentario:', error);
    if (error instanceof Error) {
      return {
        success: false,
        message: `Error al editar comentario: ${error.message}`,
      };
    } else {
      return {
        success: false,
        message: 'Error desconocido al editar comentario',
      };
    }
  }
}

export async function deleteClassComment(
  commentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await currentUser();

    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    const comment = await redis.hgetall(commentId);

    if (!comment || comment.userId !== user.id) {
      return {
        success: false,
        message: 'No tienes permiso para eliminar este comentario',
      };
    }

    await redis.del(commentId);

    return { success: true, message: 'Comentario eliminado exitosamente' };
  } catch (error: unknown) {
    console.error('Error al eliminar comentario:', error);
    if (error instanceof Error) {
      return {
        success: false,
        message: `Error al eliminar comentario: ${error.message}`,
      };
    } else {
      return {
        success: false,
        message: 'Error desconocido al eliminar comentario',
      };
    }
  }
}

export async function likeClassComment(
  commentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await currentUser();

    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    const userId = user.id;
    const likeKey = `class_like:${userId}:${commentId}`;

    const alreadyLiked = await redis.exists(likeKey);

    if (alreadyLiked) {
      await redis.hincrby(commentId, 'likes', -1);
      await redis.del(likeKey);
      return { success: true, message: 'Me gusta eliminado exitosamente' };
    } else {
      await redis.hincrby(commentId, 'likes', 1);
      await redis.set(likeKey, '1');
      return { success: true, message: 'Me gusta agregado exitosamente' };
    }
  } catch (error: unknown) {
    console.error('Error al modificar me gusta:', error);
    if (error instanceof Error) {
      return {
        success: false,
        message: `Error al modificar me gusta: ${error.message}`,
      };
    } else {
      return {
        success: false,
        message: 'Error desconocido al modificar me gusta',
      };
    }
  }
}

interface ClassComment {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  userName: string;
  likes: number;
  userId: string;
  userLiked: boolean;
}
