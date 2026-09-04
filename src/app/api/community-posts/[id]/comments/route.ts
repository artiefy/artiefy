import { NextRequest, NextResponse } from 'next/server';

import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { canViewCommunityPost } from '~/components/estudiantes/proyectos/projectSocialData';
import { db } from '~/server/db';
import { communityPostComments, users } from '~/server/db/schema';
import { getApiSession } from '~/server/utils/apiAuth';

import type { CommunityPostComment } from '~/components/estudiantes/proyectos/types';

const MAX_CONTENT_LENGTH = 2000;

// Techo de lectura del hilo. No es una limitación del modelo (la anidación
// es ilimitada) sino del tamaño de UNA respuesta: hace el peor caso finito
// tanto para Postgres como para el navegador. Si en producción los hilos lo
// rozan, el siguiente paso es paginar por raíces, algo que este diseño de
// lista plana + armado en memoria admite sin tocar el esquema.
const MAX_COMMENTS_PER_POST = 500;

// Profundidad máxima que se sirve. Nada en Postgres impide que `parent_id`
// forme un ciclo (una FK solo exige que la fila destino exista), así que el
// armado nunca camina hacia arriba y además corta aquí.
const MAX_DEPTH = 40;

const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(MAX_CONTENT_LENGTH),
  parentId: z.coerce.number().int().positive().optional(),
});

const respond = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

// Copia local del mismo helper que ya tiene
// `src/app/api/projects/[id]/comments/route.ts`: este repo todavía no
// comparte un módulo de avatares.
const toAvatarUrl = (profileImageKey?: string | null) => {
  if (!profileImageKey) return undefined;
  if (
    profileImageKey.startsWith('http://') ||
    profileImageKey.startsWith('https://')
  ) {
    return profileImageKey;
  }
  const bucket = process.env.NEXT_PUBLIC_AWS_S3_URL;
  if (!bucket) return undefined;
  return `${bucket}/${profileImageKey}`;
};

interface CommentRow {
  id: number;
  parentId: number | null;
  content: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  authorName: string | null;
  authorEmail: string;
  authorProfileImageKey: string | null;
}

const toNode = (row: CommentRow): CommunityPostComment => {
  const isDeleted = row.deletedAt !== null;
  return {
    id: row.id,
    parentId: row.parentId,
    // Ni el texto original ni la identidad del autor salen del servidor una
    // vez que el comentario está marcado como eliminado.
    content: isDeleted ? '' : row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    isDeleted,
    author: isDeleted
      ? null
      : {
          id: row.authorId,
          name: row.authorName?.trim() || row.authorEmail,
          avatarUrl: toAvatarUrl(row.authorProfileImageKey),
        },
    replies: [],
  };
};

/**
 * Arma el árbol en el SERVIDOR, en una sola pasada hacia adelante, para que
 * el corte de ciclos y la promoción de huérfanos ocurran una vez y valgan
 * para las tres superficies que montan `CommunityPostCard`.
 *
 * Tres invariantes:
 * 1. Nunca se camina hacia ARRIBA por la cadena de padres: ese recorrido es
 *    el que se cuelga con datos cíclicos.
 * 2. Un comentario cuyo padre no está en la ventana leída se promueve a
 *    raíz en vez de desaparecer, que para quien lo escribió sería pérdida
 *    de datos.
 * 3. El descenso lleva un `Set` de visitados y un tope de profundidad: un
 *    nodo ya visto no se vuelve a colgar, y lo que queda inalcanzable (es
 *    decir, lo que forma un ciclo) simplemente no se sirve.
 */
const buildCommentTree = (
  rows: CommentRow[],
  postId: number
): CommunityPostComment[] => {
  const byId = new Map<number, CommunityPostComment>();
  for (const row of rows) {
    byId.set(row.id, toNode(row));
  }

  const childrenByParent = new Map<number, CommunityPostComment[]>();
  const roots: CommunityPostComment[] = [];
  for (const row of rows) {
    const node = byId.get(row.id);
    if (!node) continue;
    if (row.parentId === null || !byId.has(row.parentId)) {
      roots.push(node);
      continue;
    }
    const siblings = childrenByParent.get(row.parentId) ?? [];
    siblings.push(node);
    childrenByParent.set(row.parentId, siblings);
  }

  const visited = new Set<number>();
  const attachReplies = (node: CommunityPostComment, depth: number) => {
    visited.add(node.id);
    if (depth >= MAX_DEPTH) return;
    const children = childrenByParent.get(node.id) ?? [];
    for (const child of children) {
      if (visited.has(child.id)) continue;
      node.replies.push(child);
      attachReplies(child, depth + 1);
    }
  };

  for (const root of roots) {
    if (visited.has(root.id)) continue;
    attachReplies(root, 0);
  }

  if (visited.size < rows.length) {
    // Sale en los logs con el id de la publicación en vez de perderse en
    // silencio: lo único que deja filas inalcanzables es una cadena de
    // padres corrupta o un hilo más hondo que MAX_DEPTH.
    console.error(
      `[community-posts/${postId}/comments] ${
        rows.length - visited.size
      } comentario(s) sin servir: cadena de padres cíclica o de más de ${MAX_DEPTH} niveles`
    );
  }

  return roots;
};

// Mismo criterio que `resolveProjectId` en api/community-posts/route.ts: sin
// truncar ni exigir positivo, un "1.5" pasa la validación y llega a una
// columna integer, y Postgres responde 22P02 — un 500 genérico donde debía
// haber un 400 claro.
const parsePostId = (value: string) => {
  const postId = Number(value);
  if (!Number.isFinite(postId)) return null;
  const truncated = Math.trunc(postId);
  return truncated > 0 ? truncated : null;
};

// GET /api/community-posts/[id]/comments — árbol completo de comentarios de
// una publicación, más antiguos primero (el orden de lectura de una
// conversación).
//
// Sin sesión NO se responde 401, igual que `GET /api/community-posts`: quien
// visita sin cuenta ve el hilo de una publicación pública o recibe 404. La
// visibilidad la decide siempre `canViewCommunityPost` con el id de quien
// mira; los comentarios no tienen regla propia, la heredan entera de su
// publicación. No lleva `revalidate` ni `use cache` a propósito: la
// respuesta depende del visitante y una caché sin esa clave serviría el hilo
// privado de una persona a otra.
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession();

    const { id } = await context.params;
    const postId = parsePostId(id);
    if (postId === null) {
      return respond({ error: 'ID de publicación inválido' }, 400);
    }

    const post = await canViewCommunityPost(
      postId,
      session.userId,
      session.isStaff
    );
    if (!post) return respond({ error: 'Publicación no encontrada' }, 404);

    const rows = await db
      .select({
        id: communityPostComments.id,
        parentId: communityPostComments.parentId,
        content: communityPostComments.content,
        deletedAt: communityPostComments.deletedAt,
        createdAt: communityPostComments.createdAt,
        updatedAt: communityPostComments.updatedAt,
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
        authorProfileImageKey: users.profileImageKey,
      })
      .from(communityPostComments)
      .innerJoin(users, eq(communityPostComments.userId, users.id))
      .where(eq(communityPostComments.postId, postId))
      .orderBy(asc(communityPostComments.createdAt))
      .limit(MAX_COMMENTS_PER_POST);

    return respond({ items: buildCommentTree(rows, postId) });
  } catch (error) {
    console.error('Error GET /api/community-posts/[id]/comments', error);
    return respond({ error: 'Error interno del servidor' }, 500);
  }
}

// POST /api/community-posts/[id]/comments — crea un comentario raíz o una
// respuesta. CUALQUIER usuario con sesión puede comentar y responder: esto
// es un feed social, no el hilo de retroalimentación de un proyecto (que sí
// restringe la raíz a educador/super-admin).
//
// A diferencia de `POST /api/projects/[id]/feedback`, aquí el padre se
// asigna TAL CUAL (`parentId`), nunca `parent.parentId ?? parent.id`: esa
// expresión es exactamente el tope de dos niveles, y copiarla anularía en
// silencio la anidación ilimitada.
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession();
    if (!session.userId) return respond({ error: 'No autorizado' }, 401);

    const { id } = await context.params;
    const postId = parsePostId(id);
    if (postId === null) {
      return respond({ error: 'ID de publicación inválido' }, 400);
    }

    const post = await canViewCommunityPost(
      postId,
      session.userId,
      session.isStaff
    );
    if (!post) return respond({ error: 'Publicación no encontrada' }, 404);

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return respond({ error: 'JSON inválido' }, 400);
    }

    const parsed = createCommentSchema.safeParse(rawBody);
    if (!parsed.success) {
      return respond(
        { error: 'Datos inválidos', issues: parsed.error.issues },
        400
      );
    }
    const { content, parentId } = parsed.data;

    if (parentId !== undefined) {
      const [parent] = await db
        .select({
          id: communityPostComments.id,
          postId: communityPostComments.postId,
          deletedAt: communityPostComments.deletedAt,
        })
        .from(communityPostComments)
        .where(eq(communityPostComments.id, parentId))
        .limit(1);

      // Guardia contra el injerto entre publicaciones: sin ella se podría
      // colgar un comentario de un hilo que quien llama no puede leer, o
      // arrastrar un subárbol legible bajo un padre invisible.
      //
      // "No existe" y "existe pero es de otra publicación" responden lo MISMO
      // a propósito: distinguirlos convertía este endpoint en un oráculo para
      // enumerar ids de comentarios, incluidos los de publicaciones que quien
      // pregunta no puede ver.
      if (!parent || parent.postId !== postId) {
        return respond(
          { error: 'El comentario al que respondes no existe' },
          400
        );
      }
      if (parent.deletedAt !== null) {
        return respond(
          { error: 'No puedes responder a un comentario eliminado' },
          400
        );
      }
    }

    const [created] = await db
      .insert(communityPostComments)
      .values({
        postId,
        parentId: parentId ?? null,
        userId: session.userId,
        content,
      })
      .returning();

    if (!created) {
      return respond({ error: 'No se pudo crear el comentario' }, 500);
    }

    const [author] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        profileImageKey: users.profileImageKey,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const comment: CommunityPostComment = {
      id: created.id,
      parentId: created.parentId,
      content: created.content,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      isDeleted: false,
      author: {
        id: author?.id ?? session.userId,
        name: author?.name?.trim() || author?.email || 'Usuario',
        avatarUrl: toAvatarUrl(author?.profileImageKey),
      },
      replies: [],
    };

    return respond({ comment }, 201);
  } catch (error) {
    console.error('Error POST /api/community-posts/[id]/comments', error);
    return respond({ error: 'Error interno del servidor' }, 500);
  }
}
