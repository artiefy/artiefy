import { NextRequest, NextResponse } from 'next/server';

import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { canViewCommunityPost } from '~/components/estudiantes/proyectos/projectSocialData';
import { db } from '~/server/db';
import { communityPostComments } from '~/server/db/schema';
import { getApiSession } from '~/server/utils/apiAuth';

const MAX_CONTENT_LENGTH = 2000;

// El cuerpo NO acepta `parentId`. Re-emparentar es la única operación capaz
// de introducir un ciclo en la cadena de padres, así que la API sencillamente
// no la ofrece.
const updateCommentSchema = z.object({
  content: z.string().trim().min(1).max(MAX_CONTENT_LENGTH),
});

const respond = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

// Ver la nota en ../route.ts: truncar y exigir positivo evita que un id como
// "1.5" o "0x10" llegue a una columna integer.
const parseId = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const truncated = Math.trunc(parsed);
  return truncated > 0 ? truncated : null;
};

// Busca el comentario EXIGIENDO que cuelgue de esta publicación: un id de
// otra publicación devuelve `null` y, con él, un 404, en vez de dejar editar
// a través de una ruta que no le corresponde.
async function resolveComment(postId: number, commentId: number) {
  const [comment] = await db
    .select({
      id: communityPostComments.id,
      userId: communityPostComments.userId,
      deletedAt: communityPostComments.deletedAt,
    })
    .from(communityPostComments)
    .where(
      and(
        eq(communityPostComments.id, commentId),
        eq(communityPostComments.postId, postId)
      )
    )
    .limit(1);
  return comment ?? null;
}

// PATCH /api/community-posts/[id]/comments/[commentId] — edita el texto de
// un comentario. Solo su autor, con el mismo 404-antes-que-403 de
// `PATCH /api/community-posts/[id]`: nunca se revela la existencia de un
// comentario que quien llama no puede ver. Un comentario ya eliminado
// (lápida) no se puede editar.
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getApiSession();
    if (!session.userId) return respond({ error: 'No autorizado' }, 401);

    const { id, commentId: rawCommentId } = await context.params;
    const postId = parseId(id);
    if (postId === null) {
      return respond({ error: 'ID de publicación inválido' }, 400);
    }
    const commentId = parseId(rawCommentId);
    if (commentId === null) {
      return respond({ error: 'ID de comentario inválido' }, 400);
    }

    const post = await canViewCommunityPost(
      postId,
      session.userId,
      session.isStaff
    );
    if (!post) return respond({ error: 'Publicación no encontrada' }, 404);

    const comment = await resolveComment(postId, commentId);
    if (!comment || comment.deletedAt !== null) {
      return respond({ error: 'Comentario no encontrado' }, 404);
    }
    if (comment.userId !== session.userId) {
      return respond(
        { error: 'No tienes permiso para editar este comentario' },
        403
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return respond({ error: 'JSON inválido' }, 400);
    }

    const parsed = updateCommentSchema.safeParse(rawBody);
    if (!parsed.success) {
      return respond(
        { error: 'Datos inválidos', issues: parsed.error.issues },
        400
      );
    }

    const [updated] = await db
      .update(communityPostComments)
      .set({ content: parsed.data.content })
      .where(eq(communityPostComments.id, commentId))
      .returning();

    // El comentario pudo borrarse entre `resolveComment` y este UPDATE: sin
    // esta guarda, `updated` es undefined y el acceso a `.createdAt` lanza un
    // TypeError que el catch convierte en 500, escondiendo el 404 real.
    if (!updated) {
      return respond({ error: 'Comentario no encontrado' }, 404);
    }

    return respond({
      comment: {
        id: updated.id,
        parentId: updated.parentId,
        content: updated.content,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(
      'Error PATCH /api/community-posts/[id]/comments/[commentId]',
      error
    );
    return respond({ error: 'Error interno del servidor' }, 500);
  }
}

// DELETE /api/community-posts/[id]/comments/[commentId] — borra un
// comentario. Lo puede hacer su autor o el staff de la plataforma
// (educador/admin/super-admin, el mismo conjunto que `STAFF_ROLES` en el
// feed, resuelto aquí por `getApiSession().isStaff`).
//
// Dos ramas, a propósito, en vez de dejar actuar al `onDelete: 'cascade'`
// del esquema: ese cascade es la red de seguridad para cuando se borra la
// publicación entera, no la vía normal. Si se ejecutara aquí, una persona
// borrando SU comentario destruiría las respuestas de otras.
// - Hoja (sin respuestas): borrado real, no hay nada que preservar y una
//   lápida ahí solo ensucia el hilo.
// - Con respuestas: lápida (`deletedAt`), que la lectura traduce a
//   "Comentario eliminado" conservando la conversación colgada debajo.
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getApiSession();
    if (!session.userId) return respond({ error: 'No autorizado' }, 401);

    const { id, commentId: rawCommentId } = await context.params;
    const postId = parseId(id);
    if (postId === null) {
      return respond({ error: 'ID de publicación inválido' }, 400);
    }
    const commentId = parseId(rawCommentId);
    if (commentId === null) {
      return respond({ error: 'ID de comentario inválido' }, 400);
    }

    const post = await canViewCommunityPost(
      postId,
      session.userId,
      session.isStaff
    );
    if (!post) return respond({ error: 'Publicación no encontrada' }, 404);

    const comment = await resolveComment(postId, commentId);
    if (!comment || comment.deletedAt !== null) {
      return respond({ error: 'Comentario no encontrado' }, 404);
    }
    if (comment.userId !== session.userId && !session.isStaff) {
      return respond(
        { error: 'No tienes permiso para eliminar este comentario' },
        403
      );
    }

    const [child] = await db
      .select({ id: communityPostComments.id })
      .from(communityPostComments)
      .where(eq(communityPostComments.parentId, commentId))
      .limit(1);

    if (child) {
      await db
        .update(communityPostComments)
        .set({ content: '', deletedAt: new Date() })
        .where(eq(communityPostComments.id, commentId));
      return respond({ success: true, deleted: 'tombstone' });
    }

    await db
      .delete(communityPostComments)
      .where(eq(communityPostComments.id, commentId));

    return respond({ success: true, deleted: 'row' });
  } catch (error) {
    console.error(
      'Error DELETE /api/community-posts/[id]/comments/[commentId]',
      error
    );
    return respond({ error: 'Error interno del servidor' }, 500);
  }
}
