'use server';

import { eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollmentPrograms } from '~/server/db/schema';

export async function getProgramEnrollmentCount(
  programId: number
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(enrollmentPrograms)
    .where(eq(enrollmentPrograms.programaId, programId));

  return Number(result[0]?.count ?? 0);
}
