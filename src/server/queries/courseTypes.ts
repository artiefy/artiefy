import { eq } from 'drizzle-orm';

import { db } from '../db';
import { courseTypes } from '../db/schema';

export async function getCourseTypeById(id: string | number) {
  return db.query.courseTypes.findFirst({
    where: eq(courseTypes.id, Number(id)),
  });
}
