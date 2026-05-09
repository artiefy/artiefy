'use server';

import { eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollmentPrograms } from '~/server/db/schema';

export async function getProgramEnrollmentCount(
  programId: number
): Promise<number> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollmentPrograms)
      .where(eq(enrollmentPrograms.programaId, programId));

    return Number(result[0]?.count ?? 0);
  } catch (error) {
    console.error('Error al obtener inscripciones del programa:', {
      programId,
      error: error instanceof Error ? error.message : error,
    });
    return 0;
  }
}
