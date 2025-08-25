'use server';

import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { notifications } from '~/server/db/schema';

import type { NotificationMetadata, NotificationType } from '~/types';

// Extiende NotificationType para permitir 'participation-request'
type ParticipationNotificationType = NotificationType | 'participation-request';

// Extiende NotificationMetadata para permitir projectId y requestType
type ParticipationNotificationMetadata = NotificationMetadata & {
  projectId?: number;
  requestType?: 'participation' | 'resignation';
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
    // Solo evitar duplicados para tipos distintos de 'participation-request'
    const skipDuplicateCheck = type === 'participation-request';

    let whereClause = and(
      eq(notifications.userId, userId),
      eq(notifications.type, type as NotificationType)
    );

    // Si hay activityId y lessonId, compara ambos en metadata
    if (
      metadata?.activityId !== undefined &&
      metadata?.lessonId !== undefined
    ) {
      whereClause = and(
        whereClause,
        eq(notifications.metadata, {
          activityId: metadata.activityId,
          lessonId: metadata.lessonId,
        })
      );
    } else if (metadata?.lessonId !== undefined) {
      whereClause = and(
        whereClause,
        eq(notifications.metadata, { lessonId: metadata.lessonId })
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
