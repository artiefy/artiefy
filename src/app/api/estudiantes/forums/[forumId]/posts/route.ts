import { NextResponse } from 'next/server';

import { auth, clerkClient } from '@clerk/nextjs/server';

import {
  createPost,
  getForumById,
  getPostsByForo,
} from '~/models/super-adminModels/forumAndPosts';
import { getCourseForumAccess } from '~/server/services/forums/courseForumAccess';
import { getGuidedProjectForumAccess } from '~/server/services/guided-projects/guidedForumAccess';

async function authorizeForumAccess(forumId: number, userId: string) {
  const forum = await getForumById(forumId);
  if (!forum) {
    return {
      success: false as const,
      status: 404,
      error: 'Foro no encontrado',
    };
  }

  if (forum.courseId) {
    const access = await getCourseForumAccess({
      courseId: forum.courseId.id,
      userId,
    });
    if (!access.success) {
      return {
        success: false as const,
        status: access.reason === 'COURSE_NOT_FOUND' ? 404 : 403,
        error:
          access.reason === 'COURSE_NOT_FOUND'
            ? 'Curso no encontrado'
            : 'No autorizado',
      };
    }
  } else if (forum.guidedProjectId) {
    const access = await getGuidedProjectForumAccess({
      projectId: forum.guidedProjectId.id,
      userId,
    });
    if (!access.success) {
      return {
        success: false as const,
        status: access.reason === 'PROJECT_NOT_FOUND' ? 404 : 403,
        error:
          access.reason === 'PROJECT_NOT_FOUND'
            ? 'Proyecto no encontrado'
            : 'No autorizado',
      };
    }
  } else {
    return {
      success: false as const,
      status: 400,
      error: 'El foro no tiene un propietario válido',
    };
  }

  return { success: true as const, forum };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ forumId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const resolvedParams = await params;
    const forumId = Number(resolvedParams.forumId);
    if (!Number.isInteger(forumId) || forumId <= 0) {
      return NextResponse.json(
        { error: 'ID de foro inválido' },
        { status: 400 }
      );
    }

    const access = await authorizeForumAccess(forumId, userId);
    if (!access.success) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const posts = await getPostsByForo(forumId);

    // Obtener roles de Clerk para cada usuario
    const postsWithRoles = await Promise.all(
      posts.map(async (post) => {
        try {
          const client = await clerkClient();
          const user = await client.users.getUser(post.userId.id);
          const existingRole = (post.userId as { role?: string }).role;
          const role =
            (user?.publicMetadata?.role as string) ??
            existingRole ??
            'estudiante';
          return {
            ...post,
            userId: {
              ...post.userId,
              role,
            },
          };
        } catch {
          return {
            ...post,
            userId: {
              ...post.userId,
              role: (post.userId as { role?: string }).role ?? 'estudiante',
            },
          };
        }
      })
    );

    return NextResponse.json(postsWithRoles);
  } catch (error) {
    console.error('Error loading forum posts:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar las publicaciones' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ forumId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const forumId = Number(resolvedParams.forumId);
    if (!Number.isInteger(forumId) || forumId <= 0) {
      return NextResponse.json(
        { error: 'ID de foro inválido' },
        { status: 400 }
      );
    }

    const body = (await req.json()) as unknown;
    let content = '';
    let imageKey: string | null = null;
    if (
      body &&
      typeof body === 'object' &&
      Object.prototype.hasOwnProperty.call(body, 'content') &&
      typeof (body as { content?: unknown }).content === 'string'
    ) {
      content = (body as { content: string }).content;
    }
    if (
      body &&
      typeof body === 'object' &&
      Object.prototype.hasOwnProperty.call(body, 'imageKey') &&
      typeof (body as { imageKey?: unknown }).imageKey === 'string'
    ) {
      imageKey = (body as { imageKey: string }).imageKey;
    }
    if (!content.trim()) {
      return NextResponse.json(
        { error: 'La publicación no puede estar vacía' },
        { status: 400 }
      );
    }

    const access = await authorizeForumAccess(forumId, userId);
    if (!access.success) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const post = await createPost(forumId, userId, content.trim(), imageKey);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating forum post:', error);
    return NextResponse.json(
      { error: 'No se pudo crear la publicación' },
      { status: 500 }
    );
  }
}
