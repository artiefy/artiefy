import { Suspense } from "react";

import { notFound, redirect } from "next/navigation";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { CertificationStudent } from "~/components/estudiantes/layout/certification/CertificationStudent";
import Footer from "~/components/estudiantes/layout/Footer";
import { Header } from "~/components/estudiantes/layout/Header";
import { getCourseById } from "~/server/actions/estudiantes/courses/getCourseById";
import { createNotification } from "~/server/actions/estudiantes/notifications/createNotification";
import { db } from "~/server/db";
import { certificates } from "~/server/db/schema";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CertificatePage({ params }: PageProps) {
  const [resolvedParams, { userId }] = await Promise.all([
    params,
    await auth(),
  ]);

  if (!resolvedParams?.id) {
    redirect("/estudiantes/cursos");
  }

  if (!userId) {
    redirect("/sign-in");
  }

  const courseId = Number(resolvedParams.id);

  // Buscar certificado existente
  let certificate = await db.query.certificates.findFirst({
    where: and(
      eq(certificates.userId, userId),
      eq(certificates.courseId, courseId),
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
    // Verificar progreso y nota final
    const allLessonsCompleted = course.lessons?.every(
      (l) => l.porcentajecompletado === 100,
    );
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

    if (allLessonsCompleted && finalGrade >= 3) {
      // Obtener nombre del usuario
      const userData = await db.query.users.findFirst({
        where: (u) => eq(u.id, userId),
      });
      const studentName = userData?.name ?? "";

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
        type: "CERTIFICATE_CREATED",
        title: "¡Nuevo certificado disponible!",
        message: `Has obtenido el certificado del curso: ${course.title}`,
        metadata: {
          courseId,
          certificateId: certificate.id,
        },
      });

      // Notificar al estudiante que completó el curso
      await createNotification({
        userId,
        type: "COURSE_COMPLETED",
        title: "¡Curso completado!",
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
    <div className="bg-background min-h-screen">
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
