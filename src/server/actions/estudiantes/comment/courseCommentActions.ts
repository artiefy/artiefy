'use server';

import { currentUser } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';

import { isUserEnrolled } from '~/server/actions/estudiantes/courses/enrollInCourse';

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

    const commentId = `comment:${userId}:${courseId}:${new Date().toISOString()}`;
    await redis.hmset(commentId, {
      userId,
      userName,
      courseId,
      content,
      rating,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0, // Inicializar la cantidad de "me gustas" en 0
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

// Modificar la función getCommentsByCourseId para incluir el estado de like del usuario actual
export async function getCommentsByCourseId(
  courseId: number
): Promise<{ comments: Comment[] }> {
  try {
    const user = await currentUser();
    const userId = user?.id;
    const keys = await redis.keys(`comment:*:${courseId}:*`);

    const comments = await Promise.all(
      keys.map(async (key) => {
        const comment = await redis.hgetall(key);
        if (!comment) return null;

        // Verificar si el usuario actual ha dado like
        const hasLiked = userId
          ? await redis.exists(`like:${userId}:${key}`)
          : false;

        return {
          id: key,
          content: comment.content as string,
          rating: Number(comment.rating),
          createdAt: comment.createdAt as string,
          userName: comment.userName as string,
          likes: Number(comment.likes),
          userId: comment.userId as string,
          hasLiked, // Agregar esta propiedad
        };
      })
    );

    const sortedComments = comments
      .filter((comment): comment is Comment => comment !== null)
      .sort((a, b) => b.likes - a.likes); // Ordenar los comentarios por la cantidad de "me gustas"

    return {
      comments: sortedComments,
    };
  } catch (error: unknown) {
    console.error('Error al obtener comentarios:', error);
    return { comments: [] };
  }
}

export async function editComment(
  commentId: string,
  content: string,
  rating: number // Aceptar el rating como parámetro
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
      rating, // Actualizar el rating
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

export async function deleteComment(
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

export async function likeComment(
  commentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await currentUser();

    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    const userId = user.id;
    const likeKey = `like:${userId}:${commentId}`;

    // Check if the user has already liked the comment
    const alreadyLiked = await redis.exists(likeKey);

    if (alreadyLiked) {
      // Unlike the comment
      await redis.hincrby(commentId, 'likes', -1);
      await redis.del(likeKey);
      return { success: true, message: 'Me gusta eliminado exitosamente' };
    } else {
      // Like the comment
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

// Actualizar la interface Comment
interface Comment {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  userName: string;
  likes: number;
  userId: string;
  hasLiked: boolean; // Agregar esta propiedad
}

// Agregar funciones para respuestas
export async function addReply(
  commentId: string,
  content: string
): Promise<{ success: boolean; message: string }> {
  const user = await currentUser();

  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const userId = user.id;
  const userName =
    user.username ?? user.emailAddresses[0]?.emailAddress ?? 'Anónimo';

  try {
    // Verificar que el comentario padre exista
    const parentComment = await redis.hgetall(commentId);
    if (!parentComment) {
      return {
        success: false,
        message: 'El comentario no existe',
      };
    }

    const replyId = `reply:${commentId}:${userId}:${new Date().toISOString()}`;
    await redis.hmset(replyId, {
      userId,
      userName,
      parentCommentId: commentId,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true, message: 'Respuesta agregada exitosamente' };
  } catch (error: unknown) {
    console.error('Error al agregar respuesta:', error);
    if (error instanceof Error) {
      return {
        success: false,
        message: `Error al agregar respuesta: ${error.message}`,
      };
    } else {
      return {
        success: false,
        message: 'Error desconocido al agregar respuesta',
      };
    }
  }
}

export async function getRepliesByCommentId(
  commentId: string
): Promise<Reply[]> {
  try {
    const keys = await redis.keys(`reply:${commentId}:*`);

    const replies = await Promise.all(
      keys.map(async (key) => {
        const reply = await redis.hgetall(key);
        if (!reply) return null;

        return {
          id: key,
          content: reply.content as string,
          createdAt: reply.createdAt as string,
          userName: reply.userName as string,
          userId: reply.userId as string,
          parentCommentId: reply.parentCommentId as string,
        };
      })
    );

    const sortedReplies = replies
      .filter((reply): reply is Reply => reply !== null)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    return sortedReplies;
  } catch (error: unknown) {
    console.error('Error al obtener respuestas:', error);
    return [];
  }
}

export async function deleteReply(
  replyId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await currentUser();

    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    const reply = await redis.hgetall(replyId);

    if (!reply || reply.userId !== user.id) {
      return {
        success: false,
        message: 'No tienes permiso para eliminar esta respuesta',
      };
    }

    await redis.del(replyId);

    return { success: true, message: 'Respuesta eliminada exitosamente' };
  } catch (error: unknown) {
    console.error('Error al eliminar respuesta:', error);
    if (error instanceof Error) {
      return {
        success: false,
        message: `Error al eliminar respuesta: ${error.message}`,
      };
    } else {
      return {
        success: false,
        message: 'Error desconocido al eliminar respuesta',
      };
    }
  }
}

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  userName: string;
  userId: string;
  parentCommentId: string;
}
