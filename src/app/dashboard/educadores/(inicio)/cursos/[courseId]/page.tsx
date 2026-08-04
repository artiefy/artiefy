import { Suspense } from 'react';

import Footer from '~/components/estudiantes/layout/Footer';

import CourseDetail from './CourseDetail';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: number }>;
}) {
  const resolvedParams = await params;
  return (
    <div className="min-h-screen bg-background pt-0">
      <Suspense fallback={<div className="min-h-[800px]" />}>
        {' '}
        {/* Skeleton opcional */}
        <section
          className="
            mx-auto max-w-[1600px] px-4 py-2
            md:px-6 md:py-8
            lg:px-8
          "
        >
          <CourseDetail courseId={resolvedParams.courseId} />
        </section>
      </Suspense>
      <Footer />
    </div>
  );
}
