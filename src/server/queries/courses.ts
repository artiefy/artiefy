import { eq } from 'drizzle-orm';

import { db } from '../db';
import { courses } from '../db/schema';

export async function getCourseById(id: string | number) {
  return db.query.courses.findFirst({
    where: eq(courses.id, Number(id)),
  });
}
