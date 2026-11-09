import { Skeleton } from '~/components/estudiantes/ui/skeleton';

// Account page fallback: title and stacked settings cards.
export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 pt-24 pb-12">
      <Skeleton className="mb-6 h-9 w-56" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
