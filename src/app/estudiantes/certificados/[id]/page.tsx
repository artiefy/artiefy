import { Suspense } from 'react';

import { notFound, redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';
import { and, eq, sql } from 'drizzle-orm';

import { CertificationStudent } from '~/components/estudiantes/layout/certification/CertificationStudent';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';
import { createNotification } from '~/server/actions/estudiantes/notifications/createNotification';
import { db } from '~/server/db';
import { certificates } from '~/server/db/schema';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CertificatePage({ params }: PageProps) {
  const resolvedParams = await params;
  const { userId } = await auth();

  if (!resolvedParams?.id) {
    redirect('/estudiantes/cursos');
  }

  if (!userId) {
    redirect('/sign-in');
  }

  const courseId = Number(resolvedParams.id);

  // Buscar certificado existente
  let certificate = await db.query.certificates.findFirst({
    where: and(
      eq(certificates.userId, userId),
      eq(certificates.courseId, courseId)
    ),
  });

  // Solo permitir ver el certificado si el usuario autenticado es el dueño
  if (certificate && certificate.userId !== userId) {
    notFound();
  }

  // Si no existe, verificar si el usuario cumple los requisitos y crearlo
  if (!certificate) {
    // Obtener progreso y nota final del curso
    const course = await getCourseById(courseId, userId);
    if (!course) {
      notFound();
    }

    const parametersResult = await db.execute(sql`
      SELECT COUNT(*)::int as count
      FROM parametros
      WHERE course_id = ${courseId}
    `);
    const hasParameters = Number(parametersResult.rows?.[0]?.count ?? 0) > 0;

    const parameterActivitiesResult = await db.execute(sql`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE uap.final_grade IS NOT NULL)::int as graded,
        COUNT(*) FILTER (WHERE uap.final_grade IS NULL)::int as ungraded
      FROM activities a
      JOIN parametros p ON p.id = a.parametro_id
      LEFT JOIN user_activities_progress uap
        ON uap.activity_id = a.id
        AND uap.user_id = ${userId}
      WHERE p.course_id = ${courseId}
    `);

    const totalParameterActivities = Number(
      parameterActivitiesResult.rows?.[0]?.total ?? 0
    );
    const ungradedParameterActivities = Number(
      parameterActivitiesResult.rows?.[0]?.ungraded ?? 0
    );
    const parametersFullyGraded = hasParameters
      ? totalParameterActivities > 0 && ungradedParameterActivities === 0
      : true;

    const activitiesResult = await db.execute(sql`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (
          WHERE COALESCE(uap.is_completed, false) = true
            OR COALESCE(uap.progress, 0) >= 100
        )::int as completed
      FROM activities a
      JOIN lessons l ON l.id = a.lessons_id
      LEFT JOIN user_activities_progress uap
        ON uap.activity_id = a.id
        AND uap.user_id = ${userId}
      WHERE l.course_id = ${courseId}
    `);

    const totalActivities = Number(activitiesResult.rows?.[0]?.total ?? 0);
    const completedActivities = Number(
      activitiesResult.rows?.[0]?.completed ?? 0
    );
    const hasActivities = totalActivities > 0;
    const activitiesCompleted = hasActivities
      ? completedActivities === totalActivities
      : true;

    const lessonsProgressResult = await db.execute(sql`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE COALESCE(ulp.progress, 0) > 90)::int as completed
      FROM lessons l
      LEFT JOIN user_lessons_progress ulp
        ON ulp.lesson_id = l.id
        AND ulp.user_id = ${userId}
      WHERE l.course_id = ${courseId}
    `);

    const totalLessons = Number(lessonsProgressResult.rows?.[0]?.total ?? 0);
    const lessonsAboveNinety = Number(
      lessonsProgressResult.rows?.[0]?.completed ?? 0
    );
    const lessonsProgressOk = !hasActivities
      ? totalLessons > 0 && lessonsAboveNinety === totalLessons
      : true;

    const canIssueCertificate =
      parametersFullyGraded && activitiesCompleted && lessonsProgressOk;

    // Obtener nota final promedio de las materias
    const materiasGrades = await db.query.materiaGrades.findMany({
      where: (mg) => eq(mg.userId, userId),
    });
    const courseMaterias = course.materias ?? [];
    const grades = courseMaterias.map((m) => {
      const g = materiasGrades.find((mg) => mg.materiaId === m.id);
      return g?.grade ?? 0;
    });
    const finalGrade =
      grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;

    if (canIssueCertificate) {
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
          courseId,
          grade: Number(finalGrade.toFixed(2)),
          createdAt: new Date(),
          studentName,
        })
        .returning();

      certificate = Array.isArray(newCert) ? newCert[0] : newCert;

      // Notificar al estudiante sobre el nuevo certificado
      await createNotification({
        userId,
        type: 'CERTIFICATE_CREATED',
        title: '¡Nuevo certificado disponible!',
        message: `Has obtenido el certificado del curso: ${course.title}`,
        metadata: {
          courseId,
          certificateId: certificate.id,
        },
      });

      // Notificar al estudiante que completó el curso
      await createNotification({
        userId,
        type: 'COURSE_COMPLETED',
        title: '¡Curso completado!',
        message: `Has completado el curso "${course.title}" con nota final ${finalGrade.toFixed(2)}`,
        metadata: {
          courseId,
        },
      });
    } else {
      // Si no cumple requisitos, mostrar notFound
      notFound();
    }
  }

  // Obtener datos del curso para mostrar el certificado
  const course = await getCourseById(courseId, userId);
  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>Cargando certificado...</div>}>
          <CertificationStudent
            course={course}
            userId={userId}
            studentName={certificate.studentName} // <-- Pasa el nombre original
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
