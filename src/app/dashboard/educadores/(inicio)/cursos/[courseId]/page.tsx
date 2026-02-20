import { Suspense } from 'react';

import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';

import CourseDetail from './CourseDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: number }>;
}) {
  const resolvedParams = await params;
  return (
    <div className="min-h-screen bg-background pt-0">
      <Header />
      <Suspense fallback={<div className="min-h-[800px]" />}>
        {' '}
        {/* Skeleton opcional */}
        <section className="mx-auto max-w-7xl px-4 py-2 md:px-6 md:py-8 lg:px-8">
          <CourseDetail courseId={resolvedParams.courseId} />
        </section>
      </Suspense>
      <Footer />
    </div>
  );
}
