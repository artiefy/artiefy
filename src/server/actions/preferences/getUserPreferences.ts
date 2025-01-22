'use server';

import { db } from '~/server/db';
import { preferences } from '~/server/db/schema';
import type { Preference } from '~/types';
import { eq } from 'drizzle-orm';

// Obtener preferencias del usuario
export async function getUserPreferences(
  userId: string
): Promise<Preference[]> {
  return db.query.preferences.findMany({
    where: eq(preferences.userId, userId),
    with: {
      category: true,
    },
  });
}
