import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { postLikes } from '~/server/db/schema';

const respond = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postIdsParam = searchParams.get('postIds');
    if (!postIdsParam) return respond({ counts: {}, likedIds: [] }, 200);

    const ids = postIdsParam
      .split(',')
      .map((v) => Number(v))
      .filter((n) => !isNaN(n));
    if (ids.length === 0) return respond({ counts: {}, likedIds: [] }, 200);

    const rows = await db
      .select({ postId: postLikes.postId, userId: postLikes.userId })
      .from(postLikes)
      .where(inArray(postLikes.postId, ids))
      .execute();

    const counts: Record<number, number> = {};
    rows.forEach((r: { postId: number; userId: string }) => {
      const pid = Number(r.postId);
      counts[pid] = (counts[pid] ?? 0) + 1;
    });

    let currentUserId: string | null = null;
    try {
      const authRes = await auth();
      currentUserId = authRes.userId ?? null;
    } catch {}

    const likedIds: number[] = [];
    if (currentUserId) {
      rows.forEach((r: { postId: number; userId: string }) => {
        if (r.userId === currentUserId) likedIds.push(Number(r.postId));
      });
    }

    return respond({ counts, likedIds });
  } catch (error) {
    console.error('Error GET /api/forums/posts/likes', error);
    return respond({ error: 'Server error' }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return respond({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const postId = Number(body?.postId);
    if (!postId || isNaN(postId))
      return respond({ error: 'Invalid postId' }, 400);

    // verificar si ya existe
    const existing = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
      .limit(1)
      .execute();

    let action: 'liked' | 'unliked' = 'liked';
    if (existing[0]) {
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
      action = 'unliked';
    } else {
      await db.insert(postLikes).values({ postId, userId }).execute();
      action = 'liked';
    }

    // nuevo conteo
    const countRows = await db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(eq(postLikes.postId, postId))
      .execute();
    const count = countRows.length;

    return respond({ action, count });
  } catch (error) {
    console.error('Error POST /api/forums/posts/likes', error);
    return respond({ error: 'Server error' }, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return respond({ error: 'Unauthorized' }, 401);
    const { searchParams } = new URL(req.url);
    const postIdParam = searchParams.get('postId');
    const postId = postIdParam ? Number(postIdParam) : NaN;
    if (!postId || isNaN(postId))
      return respond({ error: 'Invalid postId' }, 400);

    await db
      .delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));

    const countRows = await db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(eq(postLikes.postId, postId))
      .execute();
    const count = countRows.length;

    return respond({ action: 'unliked', count });
  } catch (error) {
    console.error('Error DELETE /api/forums/posts/likes', error);
    return respond({ error: 'Server error' }, 500);
  }
}
