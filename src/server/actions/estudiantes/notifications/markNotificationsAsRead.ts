"use server";

import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { notifications } from "~/server/db/schema";

export async function markNotificationsAsRead(userId: string): Promise<void> {
  try {
    await db
      .update(notifications)
      .set({ isRead: true, isMarked: true }) // <-- marca ambos campos
      .where(eq(notifications.userId, userId));
  } catch (error) {
    console.error("Error marking notifications as read:", error);
  }
}
