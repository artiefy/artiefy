import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { classMeetings } from '~/server/db/schema';

export async function getClassMeetingsByCourseId(courseId: number) {
  const meetings = await db
    .select()
    .from(classMeetings)
    .where(eq(classMeetings.courseId, courseId));
  return meetings;
}
