import { type NextRequest, NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { notifications } from "~/server/db/schema";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = Number(searchParams.get("id"));

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: "ID requerido" },
        { status: 400 },
      );
    }

    const deleted = await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));

    return NextResponse.json({ success: !!deleted });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar la notificación" },
      { status: 500 },
    );
  }
}
