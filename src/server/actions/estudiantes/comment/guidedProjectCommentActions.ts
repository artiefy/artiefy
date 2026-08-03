'use server';

import { currentUser } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import { and, eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';

import { db } from '~/server/db';
import { guidedEnrollments, guidedProjects } from '~/server/db/schema';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Same thresholds the courses use, so guided projects are moderated with the
// exact rules already in place for courses (see courseCommentActions.ts).
const MIN_DYNAMIC_RATING_COUNT = 5;
const LOW_RATING_THRESHOLD = 3.5;
const ADMIN_EMAIL = 'direcciongeneral@artiefy.com';

// Guided project comments live in their own Redis namespace. Reusing the
// `comment:*` prefix would make `redis.keys('comment:*:5:*')` match both a
// course and a guided project sharing the same numeric id.
const COMMENT_PREFIX = 'gpcomment';
const REPLY_PREFIX = 'gpreply';
const LIKE_PREFIX = 'gplike';

type GuidedProjectRatingSummary = {
  count: number;
  average: number;
};

interface GuidedProjectComment {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  userName: string;
  likes: number;
  userId: string;
  hasLiked: boolean;
}

interface GuidedProjectReply {
  id: string;
  content: string;
  createdAt: string;
  userName: string;
  userId: string;
  parentCommentId: string;
}

function parseGuidedProjectIdFromCommentId(commentId: string) {
  const guidedProjectId = Number(commentId.split(':')[2]);
  return Number.isFinite(guidedProjectId) ? guidedProjectId : null;
}

export async function isUserEnrolledInGuidedProject(
  guidedProjectId: number,
  userId: string
): Promise<boolean> {
  try {
    const [enrollment] = await db
      .select({ id: guidedEnrollments.id })
      .from(guidedEnrollments)
      .where(
        and(
          eq(guidedEnrollments.guidedProjectId, guidedProjectId),
          eq(guidedEnrollments.userId, userId)
        )
      )
      .limit(1);

    return Boolean(enrollment);
  } catch (error) {
    console.error(
      '[guided project comments] Error al verificar inscripción:',
      error
    );
    return false;
  }
}

async function getDynamicGuidedProjectRatingSummary(
  guidedProjectId: number
): Promise<GuidedProjectRatingSummary> {
  const keys = await redis.keys(`${COMMENT_PREFIX}:*:${guidedProjectId}:*`);
  const ratings = (
    await Promise.all(
      keys.map(async (key) => Number(await redis.hget(key, 'rating')))
    )
  ).filter((rating) => Number.isFinite(rating) && rating > 0);

  const average =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : 0;

  return { count: ratings.length, average };
}

async function sendLowRatingReviewEmail({
  guidedProjectId,
  guidedProjectTitle,
  ratingSummary,
}: {
  guidedProjectId: number;
  guidedProjectTitle: string;
  ratingSummary: GuidedProjectRatingSummary;
}) {
  if (!process.env.PASS) {
    console.warn(
      '[guided project ratings] No se envió correo: falta PASS en variables de entorno'
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: ADMIN_EMAIL,
      pass: process.env.PASS,
    },
  });

  await transporter.sendMail({
    from: `"Artiefy" <${ADMIN_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `Revisar proyecto guiado con calificación baja: ${guidedProjectTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h2>Proyecto guiado ocultado por calificación baja</h2>
        <p>
          El proyecto guiado <strong>${guidedProjectTitle}</strong> fue ocultado
          automáticamente porque su promedio dinámico está por debajo de
          ${LOW_RATING_THRESHOLD}.
        </p>
        <ul>
          <li><strong>ID del proyecto guiado:</strong> ${guidedProjectId}</li>
          <li><strong>Promedio:</strong> ${ratingSummary.average.toFixed(2)}</li>
          <li><strong>Calificaciones:</strong> ${ratingSummary.count}</li>
        </ul>
        <p>
          Revisa comentarios, actividades y experiencia del proyecto para definir
          mejoras antes de volver a publicarlo.
        </p>
      </div>
    `,
  });
}

async function evaluateGuidedProjectVisibilityAfterRatingChange(
  guidedProjectId: number
) {
  try {
    const ratingSummary =
      await getDynamicGuidedProjectRatingSummary(guidedProjectId);

    if (
      ratingSummary.count < MIN_DYNAMIC_RATING_COUNT ||
      ratingSummary.average >= LOW_RATING_THRESHOLD
    ) {
      return;
    }

    const [guidedProject] = await db
      .select({
        id: guidedProjects.id,
        title: guidedProjects.title,
        visibility: guidedProjects.visibility,
      })
      .from(guidedProjects)
      .where(eq(guidedProjects.id, guidedProjectId))
      .limit(1);

    if (!guidedProject || guidedProject.visibility === false) {
      return;
    }

    await db
      .update(guidedProjects)
      .set({ visibility: false, updatedAt: new Date() })
      .where(eq(guidedProjects.id, guidedProjectId));

    await sendLowRatingReviewEmail({
      guidedProjectId,
      guidedProjectTitle: guidedProject.title,
      ratingSummary,
    });
  } catch (error) {
    console.error(
      '[guided project ratings] Error al evaluar visibilidad del proyecto guiado:',
      error
    );
  }
}

export async function addGuidedProjectComment(
  guidedProjectId: number,
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
    const enrolled = await isUserEnrolledInGuidedProject(
      guidedProjectId,
      userId
    );

    if (!enrolled) {
      return {
        success: false,
        message: 'No estás inscrito en este proyecto guiado',
      };
    }

    const commentId = `${COMMENT_PREFIX}:${userId}:${guidedProjectId}:${new Date().toISOString()}`;
    await redis.hmset(commentId, {
      userId,
      userName,
      guidedProjectId,
      content,
      rating,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
    });

    await evaluateGuidedProjectVisibilityAfterRatingChange(guidedProjectId);

    return { success: true, message: 'Comentario agregado exitosamente' };
  } catch (error: unknown) {
    console.error('Error al agregar comentario:', error);
    if (error instanceof Error) {
      return {
        success: false,
        message: `Error al agregar comentario: ${error.message}`,
      };
    }
    return {
      success: false,
      message: 'Error desconocido al agregar comentario',
    };
  }
}

export async function getCommentsByGuidedProjectId(
  guidedProjectId: number
): Promise<{ comments: GuidedProjectComment[] }> {
  try {
    const user = await currentUser();
    const userId = user?.id;
    const keys = await redis.keys(`${COMMENT_PREFIX}:*:${guidedProjectId}:*`);

    const comments = await Promise.all(
      keys.map(async (key) => {
        const comment = await redis.hgetall(key);
        if (!comment) return null;

        const hasLiked = userId
          ? await redis.exists(`${LIKE_PREFIX}:${userId}:${key}`)
          : false;

        return {
          id: key,
          content: comment.content as string,
          rating: Number(comment.rating),
          createdAt: comment.createdAt as string,
          userName: comment.userName as string,
          likes: Number(comment.likes),
          userId: comment.userId as string,
          hasLiked: Boolean(hasLiked),
        };
      })
    );

    const sortedComments = comments
      .filter((comment): comment is GuidedProjectComment => comment !== null)
      .sort((a, b) => b.likes - a.likes);

    return { comments: sortedComments };
  } catch (error: unknown) {
    console.error('Error al obtener comentarios:', error);
    return { comments: [] };
  }
}

export async function getGuidedProjectRatingSummaries(
  guidedProjectIds: number[]
): Promise<Record<number, GuidedProjectRatingSummary>> {
  try {
    const uniqueIds = [...new Set(guidedProjectIds)].filter(Number.isFinite);
    const entries = await Promise.all(
      uniqueIds.map(async (guidedProjectId) => {
        const summary =
          await getDynamicGuidedProjectRatingSummary(guidedProjectId);
        return [guidedProjectId, summary] as const;
      })
    );

    return Object.fromEntries(entries);
  } catch (error: unknown) {
    console.error(
      'Error al obtener resúmenes de calificación de proyectos guiados:',
      error
    );
    return {};
  }
}

export async function editGuidedProjectComment(
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

    const guidedProjectId =
      Number(comment.guidedProjectId) ||
      parseGuidedProjectIdFromCommentId(commentId);
    if (guidedProjectId) {
      await evaluateGuidedProjectVisibilityAfterRatingChange(guidedProjectId);
    }

    return { success: true, message: 'Comentario editado exitosamente' };
  } catch (error: unknown) {
    console.error('Error al editar comentario:', error);
    if (error instanceof Error) {
      return {
        success: false,
        message: `Error al editar comentario: ${error.message}`,
      };
    }
    return {
      success: false,
      message: 'Error desconocido al editar comentario',
    };
  }
}

export async function deleteGuidedProjectComment(
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

    const guidedProjectId =
      Number(comment.guidedProjectId) ||
      parseGuidedProjectIdFromCommentId(commentId);
    if (guidedProjectId) {
      await evaluateGuidedProjectVisibilityAfterRatingChange(guidedProjectId);
    }

    return { success: true, message: 'Comentario eliminado exitosamente' };
  } catch (error: unknown) {
    console.error('Error al eliminar comentario:', error);
    if (error instanceof Error) {
      return {
        success: false,
        message: `Error al eliminar comentario: ${error.message}`,
      };
    }
    return {
      success: false,
      message: 'Error desconocido al eliminar comentario',
    };
  }
}

export async function likeGuidedProjectComment(
  commentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await currentUser();

    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    const likeKey = `${LIKE_PREFIX}:${user.id}:${commentId}`;
    const alreadyLiked = await redis.exists(likeKey);

    if (alreadyLiked) {
      await redis.hincrby(commentId, 'likes', -1);
      await redis.del(likeKey);
      return { success: true, message: 'Me gusta eliminado exitosamente' };
    }

    await redis.hincrby(commentId, 'likes', 1);
    await redis.set(likeKey, '1');
    return { success: true, message: 'Me gusta agregado exitosamente' };
  } catch (error: unknown) {
    console.error('Error al modificar me gusta:', error);
    if (error instanceof Error) {
      return {
        success: false,
        message: `Error al modificar me gusta: ${error.message}`,
      };
    }
    return {
      success: false,
      message: 'Error desconocido al modificar me gusta',
    };
  }
}

export async function addGuidedProjectReply(
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
    const parentComment = await redis.hgetall(commentId);
    if (!parentComment) {
      return { success: false, message: 'El comentario no existe' };
    }

    const replyId = `${REPLY_PREFIX}:${commentId}:${userId}:${new Date().toISOString()}`;
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
    }
    return {
      success: false,
      message: 'Error desconocido al agregar respuesta',
    };
  }
}

export async function getGuidedProjectRepliesByCommentId(
  commentId: string
): Promise<GuidedProjectReply[]> {
  try {
    const keys = await redis.keys(`${REPLY_PREFIX}:${commentId}:*`);

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

    return replies
      .filter((reply): reply is GuidedProjectReply => reply !== null)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  } catch (error: unknown) {
    console.error('Error al obtener respuestas:', error);
    return [];
  }
}

export async function deleteGuidedProjectReply(
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
    }
    return {
      success: false,
      message: 'Error desconocido al eliminar respuesta',
    };
  }
}
