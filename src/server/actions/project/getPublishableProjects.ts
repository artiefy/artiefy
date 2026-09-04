'use server';

import { and, desc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projects } from '~/server/db/schema';

export interface PublishableProject {
  id: number;
  name: string;
  isOwner: boolean;
}

/**
 * Projects a given user may attach a community publication to: the ones they
 * own AND have marked public. Backs the post-composer's "Buscar proyecto..."
 * selector, and the create endpoint enforces the same rule, so publishing to
 * somebody else's project is not possible from anywhere.
 *
 * A private project is deliberately excluded: a post attached to one is hidden
 * from the community feed anyway, so offering it here would only produce a
 * publication nobody — not even its author — can find.
 *
 * Ordered by most recently updated.
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
    .where(and(eq(projects.userId, userId), eq(projects.isPublic, true)))
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
