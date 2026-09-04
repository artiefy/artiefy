import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { getCommunityPostsFeedPage } from '~/components/estudiantes/proyectos/projectSocialData';
import { db } from '~/server/db';
import { communityPosts, projects } from '~/server/db/schema';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_CONTENT_LENGTH = 2000;

// Mismos roles que `src/app/proyectos/[id]/page.tsx` deja entrar a un
// proyecto privado: quien administra la plataforma ve el feed completo.
const STAFF_ROLES = ['super-admin', 'admin', 'educador'];

const createPostSchema = z.object({
  content: z.string().trim().min(1).max(MAX_CONTENT_LENGTH),
  kind: z.enum(['none', 'update', 'milestone', 'request']).default('none'),
  projectId: z.coerce.number().int().positive().optional(),
  imageKey: z.string().trim().min(1).max(1024).optional(),
  linkUrl: z.string().trim().url().max(2048).optional(),
});

const respondWithError = (message: string, status: number, issues?: unknown) =>
  NextResponse.json({ error: message, issues }, { status });

const resolveLimit = (searchParams: URLSearchParams) => {
  const raw = searchParams.get('limit');
  if (!raw) return DEFAULT_LIMIT;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT);
};

const resolveOffset = (searchParams: URLSearchParams) => {
  const raw = searchParams.get('offset');
  if (!raw) return 0;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(Math.trunc(parsed), 0);
};

const resolveProjectId = (searchParams: URLSearchParams) => {
  const raw = searchParams.get('projectId');
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return undefined;
  const projectId = Math.trunc(parsed);
  return projectId > 0 ? projectId : undefined;
};

const resolveAuthorId = (searchParams: URLSearchParams) => {
  const raw = searchParams.get('authorId')?.trim();
  return raw ? raw : undefined;
};

// GET /api/community-posts?limit=&offset=&projectId=&authorId= — feed de
// publicaciones de la comunidad, más recientes primero, con autor y proyecto
// (cuando aplica) ya resueltos para poder renderizar "«autor» publicó en
// «proyecto»".
//
// La visibilidad la decide `getCommunityPostsFeedPage` con el id de quien
// mira, jamás un parámetro de la petición: `projectId` y `authorId` solo
// pueden reducir el resultado, nunca ampliarlo —pedir el `authorId` de otra
// persona devuelve únicamente sus publicaciones generales y las de sus
// proyectos públicos. No lleva `revalidate` ni `use cache` a propósito — la
// respuesta depende del visitante y una caché sin esa clave serviría las
// publicaciones privadas de una persona a otra.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = resolveLimit(searchParams);
    const offset = resolveOffset(searchParams);
    const projectId = resolveProjectId(searchParams);
    const authorId = resolveAuthorId(searchParams);

    // Sin sesión no se responde 401: simplemente se ve la porción más
    // estricta (proyectos públicos + publicaciones generales).
    const { userId, sessionClaims } = await auth();
    const role = String(sessionClaims?.metadata?.role ?? '');

    const { items, hasMore } = await getCommunityPostsFeedPage({
      viewerId: userId,
      canSeeAllProjects: STAFF_ROLES.includes(role),
      projectId,
      authorId,
      limit,
      offset,
    });

    return NextResponse.json({
      items,
      hasMore,
      nextOffset: offset + items.length,
    });
  } catch (error) {
    console.error('[community-posts][GET] error', error);
    return respondWithError('Error al obtener publicaciones', 500);
  }
}

// POST /api/community-posts — crea una publicación de la comunidad.
// `projectId` es opcional: cuando se envía, el usuario debe ser dueño del
// proyecto o el proyecto debe ser público. Nunca se confía en el cliente
// para esta verificación.
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 401);
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return respondWithError('JSON inválido', 400);
    }

    const parsed = createPostSchema.safeParse(rawBody);
    if (!parsed.success) {
      return respondWithError('Datos inválidos', 400, parsed.error.issues);
    }

    const { content, kind, projectId, imageKey, linkUrl } = parsed.data;

    if (projectId !== undefined) {
      const [project] = await db
        .select({ userId: projects.userId })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project) {
        return respondWithError('Proyecto no encontrado', 404);
      }

      // Only the owner publishes under a project. A public project belonging
      // to somebody else is readable, not postable.
      if (project.userId !== userId) {
        return respondWithError(
          'No tienes permiso para publicar en este proyecto',
          403
        );
      }
    }

    const [created] = await db
      .insert(communityPosts)
      .values({
        userId,
        projectId: projectId ?? null,
        kind,
        content,
        imageKey: imageKey ?? null,
        linkUrl: linkUrl ?? null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[community-posts][POST] error', error);
    return respondWithError('Error al crear la publicación', 500);
  }
}
