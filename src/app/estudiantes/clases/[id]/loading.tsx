import { Skeleton } from '~/components/estudiantes/ui/skeleton';

// Lesson layout fallback: video player on the left, lesson list on the right.
export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 pt-24 pb-12 lg:px-8">
      <Skeleton className="mb-4 h-5 w-72 max-w-full" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
