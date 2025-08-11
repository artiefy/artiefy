import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { certificates } from '~/server/db/schema';

export async function issueCertificate({
  userId,
  courseId,
  grade,
  studentName,
}: {
  userId: string;
  courseId: number;
  grade: number;
  studentName: string;
}) {
  // Verifica si ya existe
  const existing = await db.query.certificates.findFirst({
    where: (cert) => eq(cert.userId, userId) && eq(cert.courseId, courseId),
  });
  if (existing) return existing;

  // Crea el certificado con el nombre original
  const cert = await db
    .insert(certificates)
    .values({
      userId,
      courseId,
      grade,
      createdAt: new Date(),
      publicCode: Math.random().toString(36).substring(2, 10),
      studentName, // Ahora sí se guarda el nombre original
    })
    .returning();

  return cert[0];
}
