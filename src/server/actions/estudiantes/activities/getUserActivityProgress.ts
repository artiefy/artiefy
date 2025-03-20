'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';

import type { UserActivitiesProgress } from '~/types';

export async function getUserActivityProgress(userId: string): Promise<UserActivitiesProgress[]> {
  try {
    const activitiesProgress = await db.query.userActivitiesProgress.findMany({
      where: eq(userActivitiesProgress.userId, userId), // Corrección de la propiedad conocida
    });
    return activitiesProgress;
  } catch (error) {
    console.error('Error al obtener el progreso de las actividades del usuario:', error);
    throw new Error('Failed to fetch user activity progress');
  }
}
