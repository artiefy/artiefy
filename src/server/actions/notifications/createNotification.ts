'use server';

import { db } from '~/server/db';
import { notifications } from '~/server/db/schema';

import type { NotificationType, NotificationMetadata } from '~/types';

export async function createNotification({
  userId,
  type,
  title,
  message,
  metadata,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
}): Promise<boolean> {
  try {
    await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      metadata,
      isRead: false,
      createdAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}
