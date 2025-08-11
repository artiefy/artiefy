"use server";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "~/server/db";
import { notifications } from "~/server/db/schema";

import type {
  Notification,
  NotificationMetadata,
  NotificationType,
} from "~/types";

interface DbNotification {
  id: number;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean | null;
  isMarked: boolean | null; // <-- nuevo campo
  createdAt: Date | null;
  metadata: unknown;
}

export async function getNotifications(
  userId: string,
  options?: { limit?: number },
): Promise<Notification[]> {
  try {
    const limit = options?.limit ?? 1000; // Por defecto trae 1000
    const results = (await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)) as DbNotification[];

    return results.map(
      (result): Notification => ({
        id: result.id,
        userId: result.userId,
        type: result.type as NotificationType,
        title: result.title,
        message: result.message,
        isRead: result.isRead ?? false,
        isMarked: result.isMarked ?? false, // <-- nuevo campo
        createdAt: result.createdAt ? new Date(result.createdAt) : new Date(),
        metadata: result.metadata as NotificationMetadata | undefined,
      }),
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );

    return result[0]?.count ?? 0;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
}
