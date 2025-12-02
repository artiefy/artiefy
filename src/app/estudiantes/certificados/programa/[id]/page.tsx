import { Suspense } from 'react';

import { notFound, redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { CertificationStudent } from '~/components/estudiantes/layout/certification/CertificationStudent';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';
import { createNotification } from '~/server/actions/estudiantes/notifications/createNotification';
import { getProgramById } from '~/server/actions/estudiantes/programs/getProgramById';
import { db } from '~/server/db';
import { certificates } from '~/server/db/schema';

import type { Course } from '~/types';

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

  // Buscar certificado existente por programa
  let certificate = await db.query.certificates.findFirst({
    where: (c) => and(eq(c.userId, userId), eq(c.programaId, programaId)),
  });

  // Si no existe, verificar requisitos y crearlo
  if (!certificate) {
    const program = await getProgramById(programaId);
    if (!program) notFound();

    // Obtener materias asociadas al programa
    const programMaterias = program.materias ?? [];

    // Obtener notas de materias del usuario
    const gradesRecords = await db.query.materiaGrades.findMany({
      where: (mg) => eq(mg.userId, userId),
    });

    // Para materias que están vinculadas a cursos, verificar tambien que las lecciones del curso estén completas
    let allPassed = true;
    const grades: number[] = [];

    for (const m of programMaterias) {
      const g = gradesRecords.find((gr) => gr.materiaId === m.id);
      const grade = g?.grade ?? 0;

      // Si la materia está asociada a un curso, verificar lecciones completadas
      if (m.courseid) {
        const course = await getCourseById(m.courseid, userId);
        if (!course) {
          allPassed = false;
          break;
        }
        const allLessonsCompleted = course.lessons?.every(
          (l) => l.porcentajecompletado === 100
        );
        if (!allLessonsCompleted) {
          allPassed = false;
          break;
        }
      }

      if (grade < 3) {
        allPassed = false;
        break;
      }

      grades.push(grade);
    }

    const programAverage =
      grades.length > 0
        ? Number((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2))
        : 0;

    if (allPassed && programAverage >= 3) {
      // Obtener nombre del usuario
      const userData = await db.query.users.findFirst({
        where: (u) => eq(u.id, userId),
      });
      const studentName = userData?.name ?? '';

      // Crear certificado
      const newCert = await db
        .insert(certificates)
        .values({
          userId,
          programaId,
          grade: programAverage,
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
    <div className="bg-background min-h-screen">
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
