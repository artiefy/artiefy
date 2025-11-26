import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { certificates } from '~/server/db/schema';

export async function issueProgramCertificate({
  userId,
  programaId,
  grade,
  studentName,
}: {
  userId: string;
  programaId: number;
  grade: number;
  studentName: string;
}) {
  // Verifica si ya existe
  const existing = await db.query.certificates.findFirst({
    where: (cert) => eq(cert.userId, userId) && eq(cert.programaId, programaId),
  });
  if (existing) return existing;

  // Crea el certificado para el programa
  const cert = await db
    .insert(certificates)
    .values({
      userId,
      programaId,
      grade,
      createdAt: new Date(),
      publicCode: Math.random().toString(36).substring(2, 10),
      studentName,
    })
    .returning();

  return cert[0];
}
