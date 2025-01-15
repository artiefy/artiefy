'use server';

import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { lessons } from '~/server/db/schema';

export async function updateLessonProgress(lessonId: number, progress: number) {
  try {
    await db
      .update(lessons)
      .set({ porcentajecompletado: progress })
      .where(eq(lessons.id, lessonId));

    return { success: true };
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    return { success: false, error: 'Failed to update lesson progress' };
  }
}
