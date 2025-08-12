import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { classMeetings } from '~/server/db/schema';

export async function getClassMeetingById(id: number) {
  const rows = await db
    .select()
    .from(classMeetings)
    .where(eq(classMeetings.id, id));
  return rows[0];
}
