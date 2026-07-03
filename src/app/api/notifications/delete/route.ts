import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { notifications } from '~/server/db/schema';

export async function DELETE(request: NextRequest) {
  try {
    // Security best practice: authenticate and scope the delete to the caller's
    // own notifications (prevents deleting another user's notifications by id).
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notificationId = Number(searchParams.get('id'));

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      );
    }

    const deleted = await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );

    return NextResponse.json({ success: !!deleted });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la notificación' },
      { status: 500 }
    );
  }
}
