import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { materias } from '~/server/db/schema';

export async function getMateriasByCourseId(courseId: string) {
  try {
    return await db
      .select()
      .from(materias)
      .where(eq(materias.courseid, parseInt(courseId)));
  } catch (error) {
    console.error('Error fetching materias:', error);
    return [];
  }
}
