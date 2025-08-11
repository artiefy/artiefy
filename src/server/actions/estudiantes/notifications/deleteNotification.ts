import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { notifications } from '~/server/db/schema';

export async function deleteNotification(id: number): Promise<boolean> {
  try {
    const deleted = await db
      .delete(notifications)
      .where(eq(notifications.id, id));
    // Si la eliminación afectó al menos una fila, retorna true
    return !!deleted;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}
