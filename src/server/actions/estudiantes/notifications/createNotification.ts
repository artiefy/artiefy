'use server';

import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { notifications } from '~/server/db/schema';

import type { NotificationMetadata, NotificationType } from '~/types';

// Extiende NotificationType para permitir 'participation-request' y 'PROJECT_INVITATION'
type ParticipationNotificationType =
  | NotificationType
  | 'participation-request'
  | 'PROJECT_INVITATION';

// Extiende NotificationMetadata para permitir projectId y requestType
type ParticipationNotificationMetadata = NotificationMetadata & {
  projectId?: number;
  requestType?: 'participation' | 'resignation';
  invitedByUserId?: string; // <-- Agregado para permitir invitedByUserId
};

export async function createNotification({
  userId,
  type,
  title,
  message,
  metadata,
}: {
  userId: string;
  type: ParticipationNotificationType;
  title: string;
  message: string;
  metadata?: ParticipationNotificationMetadata;
}): Promise<boolean> {
  try {
    // Solo evitar duplicados para tipos distintos de 'participation-request' y 'PROJECT_INVITATION'
    const skipDuplicateCheck =
      type === 'participation-request' || type === 'PROJECT_INVITATION';

    const cleanedEntries = metadata
      ? Object.entries(metadata).filter(([, value]) => value !== undefined)
      : [];
    const cleanedMetadata =
      cleanedEntries.length > 0
        ? (Object.fromEntries(
            cleanedEntries
          ) as ParticipationNotificationMetadata)
        : undefined;

    let whereClause = and(
      eq(notifications.userId, userId),
      eq(notifications.type, type as NotificationType)
    );

    if (cleanedMetadata) {
      whereClause = and(
        whereClause,
        eq(notifications.metadata, cleanedMetadata)
      );
    }

    if (!skipDuplicateCheck) {
      const existing = await db.query.notifications.findFirst({
        where: whereClause,
      });

      if (existing) {
        // Ya existe una notificación igual, no crear otra
        return false;
      }
    }

    await db.insert(notifications).values({
      userId,
      type: type as NotificationType,
      title,
      message,
      metadata: cleanedMetadata,
      isRead: false,
      createdAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}
