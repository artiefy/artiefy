'use server';

import { db } from '~/server/db';
import { projectsTaken } from '~/server/db/schema';

// Marcar un proyecto como tomado
export async function markProjectTaken(
  userId: string,
  projectId: number
): Promise<void> {
  await db.insert(projectsTaken).values({
    userId,
    projectId,
  });
}
