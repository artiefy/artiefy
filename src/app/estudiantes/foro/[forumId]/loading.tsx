import { Skeleton } from '~/components/estudiantes/ui/skeleton';

// Forum thread fallback: title row followed by a list of post cards.
export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 pt-24 pb-12">
      <Skeleton className="mb-6 h-9 w-72 max-w-full" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
