import { CatalogPageSkeleton } from '~/app/estudiantes/CourseCatalogSkeletons';

// Streamed instantly as the Suspense fallback while the catalog page renders.
// Because the student layout does not access runtime data, this shows on
// navigation without waiting for any data fetch.
export default function Loading() {
  return <CatalogPageSkeleton />;
}
