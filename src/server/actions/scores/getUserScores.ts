'use server';

import { db } from '~/server/db';
import { scores } from '~/server/db/schema';
import type { Score } from '~/types';
import { eq } from 'drizzle-orm';

// Obtener puntajes del usuario
export async function getUserScores(userId: string): Promise<Score[]> {
  return db.query.scores.findMany({
    where: eq(scores.userId, userId),
    with: {
      category: true,
    },
  });
}
