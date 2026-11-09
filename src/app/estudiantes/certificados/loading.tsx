import { CourseGridSkeleton } from '~/app/estudiantes/CourseCatalogSkeletons';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';

// Heading + card grid fallback, matching the catalog grid wrapper.
export default function Loading() {
  return (
    <main className="min-h-screen w-full max-w-full pt-24">
      <div className="mb-6 space-y-3 px-8 lg:px-26">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <CourseGridSkeleton count={8} />
    </main>
  );
}
