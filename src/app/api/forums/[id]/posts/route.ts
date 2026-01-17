import { NextResponse } from 'next/server';

import { desc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { posts, users } from '~/server/db/schema';

// GET - Obtener posts de un foro
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const forumId = parseInt(id);

    if (isNaN(forumId)) {
      return NextResponse.json({ error: 'Invalid forumId' }, { status: 400 });
    }

    const forumPosts = await db
      .select({
        id: posts.id,
        forumId: posts.forumId,
        userId: posts.userId,
        content: posts.content,
        imageKey: posts.imageKey,
        audioKey: posts.audioKey,
        videoKey: posts.videoKey,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          profileImageKey: users.profileImageKey,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.forumId, forumId))
      .orderBy(desc(posts.createdAt));

    return NextResponse.json(forumPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Error fetching posts' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo post
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const forumId = parseInt(id);
    const body = await request.json();
    const { content, userId } = body;

    if (isNaN(forumId) || !content || !userId) {
      return NextResponse.json(
        { error: 'forumId, content, and userId are required' },
        { status: 400 }
      );
    }

    const newPost = await db
      .insert(posts)
      .values({
        forumId,
        userId,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Obtener el post con información del usuario
    const postWithUser = await db
      .select({
        id: posts.id,
        forumId: posts.forumId,
        userId: posts.userId,
        content: posts.content,
        imageKey: posts.imageKey,
        audioKey: posts.audioKey,
        videoKey: posts.videoKey,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          profileImageKey: users.profileImageKey,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, newPost[0]!.id))
      .limit(1);

    return NextResponse.json(postWithUser[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Error creating post' }, { status: 500 });
  }
}
