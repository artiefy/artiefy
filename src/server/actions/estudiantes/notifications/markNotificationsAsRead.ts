'use server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { notifications } from '~/server/db/schema';

export async function markNotificationsAsRead(_userId?: string): Promise<void> {
  try {
    const { userId } = await auth();
    if (!userId) return;
    await db
      .update(notifications)
      .set({ isRead: true, isMarked: true }) // <-- marca ambos campos
      .where(eq(notifications.userId, userId));
  } catch (error) {}
}
