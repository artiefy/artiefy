"use server";

import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { notifications } from "~/server/db/schema";

import type { NotificationMetadata, NotificationType } from "~/types";

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
    // Verifica si ya existe una notificación igual (por tipo, usuario y metadata relevante)
    let whereClause = and(
      eq(notifications.userId, userId),
      eq(notifications.type, type),
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
        }),
      );
    } else if (metadata?.lessonId !== undefined) {
      whereClause = and(
        whereClause,
        eq(notifications.metadata, { lessonId: metadata.lessonId }),
      );
    }

    const existing = await db.query.notifications.findFirst({
      where: whereClause,
    });

    if (existing) {
      // Ya existe una notificación igual, no crear otra
      return false;
    }

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
    console.error("Error creating notification:", error);
    return false;
  }
}
