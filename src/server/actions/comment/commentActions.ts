'use server';

import { currentUser } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function addComment(courseId: number, content: string, rating: number): Promise<{ success: boolean; message: string }> {
  const user = await currentUser();

  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const userId = user.id;

  try {
    const existingEnrollment = await redis.hgetall(`enrollment:${userId}:${courseId}`);

    if (!existingEnrollment) {
      return { success: false, message: 'No estás inscrito en este curso' };
    }

    await redis.hmset(`comment:${userId}:${courseId}:${new Date().toISOString()}`, {
      userId,
      courseId,
      content,
      rating,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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