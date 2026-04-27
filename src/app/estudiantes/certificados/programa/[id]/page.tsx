import { Suspense } from 'react';

import { type Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { CertificationStudent } from '~/components/estudiantes/layout/certification/CertificationStudent';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { getEnrolledCourses } from '~/server/actions/estudiantes/courses/getEnrolledCourses';
import { createNotification } from '~/server/actions/estudiantes/notifications/createNotification';
import { getProgramById } from '~/server/actions/estudiantes/programs/getProgramById';
import { db } from '~/server/db';
import { certificates, users } from '~/server/db/schema';

import type { Course } from '~/types';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProgramCertificatePage({ params }: PageProps) {
  const resolvedParams = await params;
  const { userId } = await auth();

  if (!resolvedParams?.id) {
    redirect('/estudiantes/programas');
  }

  if (!userId) {
    redirect('/sign-in');
  }

  const programaId = Number(resolvedParams.id);
  const programId = programaId; // alias en metadata (naming consistente)

  // Validación invisible: verificar inscripción al programa
  const programEnrollment = await db.query.enrollmentPrograms.findFirst({
    where: (ep) => and(eq(ep.userId, userId), eq(ep.programaId, programaId)),
  });

  if (!programEnrollment) {
    notFound();
  }

  // Buscar certificado existente por programa
  let certificate = await db.query.certificates.findFirst({
    where: (c) => and(eq(c.userId, userId), eq(c.programaId, programaId)),
  });

  // Si no existe, verificar requisitos y crearlo
  if (!certificate) {
    const program = await getProgramById(programaId);
    if (!program) notFound();

    const programCourseIds = Array.from(
      new Set(
        (program.materias ?? [])
          .map((materia) => materia.courseid)
          .filter((courseId): courseId is number => Number.isFinite(courseId))
      )
    );

    if (programCourseIds.length === 0) {
      notFound();
    }

    const enrolledCourses = await getEnrolledCourses(userId);
    const enrolledCoursesMap = new Map(
      enrolledCourses.map((course) => [course.id, course.progress ?? 0])
    );

    const allProgramCoursesCompleted = programCourseIds.every(
      (courseId) => (enrolledCoursesMap.get(courseId) ?? 0) >= 100
    );

    if (allProgramCoursesCompleted) {
      const userData = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      const studentName = userData?.name ?? '';

      // Crear certificado
      const newCert = await db
        .insert(certificates)
        .values({
          userId,
          programaId,
          grade: 5,
          createdAt: new Date(),
          studentName,
        })
        .returning();

      certificate = Array.isArray(newCert) ? newCert[0] : newCert;

      // Notificar al estudiante
      await createNotification({
        userId,
        type: 'CERTIFICATE_CREATED',
        title: '¡Nuevo certificado disponible!',
        message: `Has obtenido el certificado del programa: ${program.title}`,
        metadata: {
          programId,
          certificateId: certificate.id,
        },
      });
    } else {
      notFound();
    }
  }

  // Obtener datos del programa para mostrar el certificado
  const program = await getProgramById(programaId);
  if (!program) notFound();

  // Reusar el componente de certificado (espera `course`) pasando un objeto con title/id del programa
  const fakeCourse = {
    id: program.id,
    title: program.title,
  } as unknown as Course;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>Cargando certificado...</div>}>
          <CertificationStudent
            course={fakeCourse}
            userId={userId}
            studentName={certificate?.studentName}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
