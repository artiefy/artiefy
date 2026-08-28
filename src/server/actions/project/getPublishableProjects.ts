'use server';

import { desc, eq, or } from 'drizzle-orm';

import { db } from '~/server/db';
import { projects } from '~/server/db/schema';

export interface PublishableProject {
  id: number;
  name: string;
  isOwner: boolean;
}

/**
 * Projects a given user may attach a community publication to: every
 * project they own (private or public) plus every other public project.
 * Backs the post-composer's "Buscar proyecto..." selector.
 *
 * Own projects are sorted first, then everything is ordered by most
 * recently updated.
 */
export async function getPublishableProjects(
  userId: string
): Promise<PublishableProject[]> {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      userId: projects.userId,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(or(eq(projects.userId, userId), eq(projects.isPublic, true)))
    .orderBy(desc(projects.updatedAt));

  const deduped = new Map<number, PublishableProject & { updatedAt: Date }>();

  for (const row of rows) {
    if (deduped.has(row.id)) continue;
    deduped.set(row.id, {
      id: row.id,
      name: row.name,
      isOwner: row.userId === userId,
      updatedAt: row.updatedAt,
    });
  }

  return Array.from(deduped.values())
    .sort((a, b) => {
      if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    })
    .map(({ id, name, isOwner }) => ({ id, name, isOwner }));
}
