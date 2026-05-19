import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  projectComments,
  projectFollows,
  projectLikes,
  projects,
  projectSaves,
  projectShares,
} from '~/server/db/schema';

const respond = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectIdsParam = searchParams.get('projectIds');

    if (!projectIdsParam) {
      return respond({
        counts: {},
        likedIds: [],
        savedIds: [],
        sharedIds: [],
        followedIds: [],
      });
    }

    const projectIds = projectIdsParam
      .split(',')
      .map((rawId) => Number(rawId))
      .filter((id) => Number.isFinite(id));

    if (projectIds.length === 0) {
      return respond({
        counts: {},
        likedIds: [],
        savedIds: [],
        sharedIds: [],
        followedIds: [],
      });
    }

    const validProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(inArray(projects.id, projectIds));

    const validProjectIds = validProjects.map((project) => project.id);
    if (validProjectIds.length === 0) {
      return respond({
        counts: {},
        likedIds: [],
        savedIds: [],
        sharedIds: [],
        followedIds: [],
      });
    }

    const [likesRows, savesRows, sharesRows, commentsRows] = await Promise.all([
      db
        .select({
          projectId: projectLikes.projectId,
          userId: projectLikes.userId,
        })
        .from(projectLikes)
        .where(inArray(projectLikes.projectId, validProjectIds)),
      db
        .select({
          projectId: projectSaves.projectId,
          userId: projectSaves.userId,
        })
        .from(projectSaves)
        .where(inArray(projectSaves.projectId, validProjectIds)),
      db
        .select({
          projectId: projectShares.projectId,
          userId: projectShares.userId,
        })
        .from(projectShares)
        .where(inArray(projectShares.projectId, validProjectIds)),
      db
        .select({ projectId: projectComments.projectId })
        .from(projectComments)
        .where(inArray(projectComments.projectId, validProjectIds)),
    ]);

    const counts: Record<
      number,
      { likes: number; comments: number; saves: number; shares: number }
    > = {};

    validProjectIds.forEach((projectId) => {
      counts[projectId] = {
        likes: 0,
        comments: 0,
        saves: 0,
        shares: 0,
      };
    });

    likesRows.forEach((row) => {
      if (!counts[row.projectId]) return;
      counts[row.projectId].likes += 1;
    });

    savesRows.forEach((row) => {
      if (!counts[row.projectId]) return;
      counts[row.projectId].saves += 1;
    });

    sharesRows.forEach((row) => {
      if (!counts[row.projectId]) return;
      counts[row.projectId].shares += 1;
    });

    commentsRows.forEach((row) => {
      if (!counts[row.projectId]) return;
      counts[row.projectId].comments += 1;
    });

    let currentUserId: string | null = null;
    try {
      const authResult = await auth();
      currentUserId = authResult.userId ?? null;
    } catch {
      currentUserId = null;
    }

    if (!currentUserId) {
      return respond({
        counts,
        likedIds: [],
        savedIds: [],
        sharedIds: [],
        followedIds: [],
      });
    }

    const [likedRows, savedRows, sharedRows, followedRows] = await Promise.all([
      db
        .select({ projectId: projectLikes.projectId })
        .from(projectLikes)
        .where(
          and(
            inArray(projectLikes.projectId, validProjectIds),
            eq(projectLikes.userId, currentUserId)
          )
        ),
      db
        .select({ projectId: projectSaves.projectId })
        .from(projectSaves)
        .where(
          and(
            inArray(projectSaves.projectId, validProjectIds),
            eq(projectSaves.userId, currentUserId)
          )
        ),
      db
        .select({ projectId: projectShares.projectId })
        .from(projectShares)
        .where(
          and(
            inArray(projectShares.projectId, validProjectIds),
            eq(projectShares.userId, currentUserId)
          )
        ),
      db
        .select({ projectId: projectFollows.projectId })
        .from(projectFollows)
        .where(
          and(
            inArray(projectFollows.projectId, validProjectIds),
            eq(projectFollows.userId, currentUserId)
          )
        ),
    ]);

    return respond({
      counts,
      likedIds: likedRows.map((row) => row.projectId),
      savedIds: savedRows.map((row) => row.projectId),
      sharedIds: sharedRows.map((row) => row.projectId),
      followedIds: followedRows.map((row) => row.projectId),
    });
  } catch (error) {
    console.error('Error GET /api/projects/interactions', error);
    return respond({ error: 'Error interno del servidor' }, 500);
  }
}
