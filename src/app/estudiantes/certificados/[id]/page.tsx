import { Suspense } from 'react';

import { notFound, redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { CertificationStudent } from '~/components/estudiantes/layout/certification/CertificationStudent';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';
import { db } from '~/server/db';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CertificatePage({ params }: PageProps) {
  const [resolvedParams, { userId }] = await Promise.all([
    params,
    await auth(),
  ]);

  if (!resolvedParams?.id) {
    redirect('/estudiantes/cursos');
  }

  if (!userId) {
    redirect('/sign-in');
  }

  const courseId = Number(resolvedParams.id);

  const certificate = await db.query.certificates.findFirst({
    where: (cert) => eq(cert.userId, userId) && eq(cert.courseId, courseId),
  });

  if (!certificate) {
    notFound();
  }

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
