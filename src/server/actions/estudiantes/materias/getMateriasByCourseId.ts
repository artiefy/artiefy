import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { materias } from "~/server/db/schema";

export async function getMateriasByCourseId(courseId: number) {
  try {
    const result = await db
      .select()
      .from(materias)
      .where(eq(materias.courseid, courseId));

    return result;
  } catch (error) {
    console.error("Error fetching materias:", error);
    return [];
  }
}
