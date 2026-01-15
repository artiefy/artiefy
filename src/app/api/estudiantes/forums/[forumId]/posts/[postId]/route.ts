import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { posts } from '~/server/db/schema';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ forumId: string; postId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { forumId: _forumId, postId } = await params;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Verificar que el post pertenece al usuario
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, parseInt(postId)))
      .limit(1);

    if (!post[0] || post[0].userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db
      .update(posts)
      .set({ content: content.trim(), updatedAt: new Date() })
      .where(eq(posts.id, parseInt(postId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ forumId: string; postId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { forumId: _forumId, postId } = await params;

    // Verificar que el post pertenece al usuario
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, parseInt(postId)))
      .limit(1);

    if (!post[0] || post[0].userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(posts).where(eq(posts.id, parseInt(postId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
