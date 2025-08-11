import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { activities } from "~/server/db/schema";

// Obtener actividades relacionadas con una lección específica desde la base de datos
export async function getRelatedActivities(lessonId: number) {
  return await db
    .select()
    .from(activities)
    .where(eq(activities.lessonsId, lessonId));
}
