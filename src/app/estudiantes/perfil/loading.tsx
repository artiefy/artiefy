import { Skeleton } from '~/components/estudiantes/ui/skeleton';

// Route-scoped loading skeleton for /estudiantes/perfil. It mirrors the real
// ProfileView layout (banner height, overlapping avatar, name/username, bio,
// meta, stats, tabs) so it does not fall back to the catalog skeleton and does
// not shift the layout when the real content streams in.
export default function Loading() {
  return (
    <main className="relative pt-14 pb-12 lg:pt-20 lg:pb-20">
      <div
        className="
          mx-auto max-w-3xl px-4
          sm:px-6
          lg:max-w-6xl lg:px-8
          xl:max-w-7xl
        "
      >
        <Skeleton className="mb-4 h-9 w-24 rounded-xl lg:mb-6" />

        <div className="relative mb-8 lg:mb-10">
          {/* Banner */}
          <Skeleton
            className="
              h-32 w-full rounded-2xl
              sm:h-40
              lg:h-56 lg:rounded-3xl
              xl:h-64
            "
          />

          <div className="-mt-12 px-4 sm:px-6 lg:-mt-16 lg:px-8 xl:px-10">
            <div
              className="
                flex flex-col gap-4
                sm:flex-row sm:items-end
                lg:gap-6
              "
            >
              {/* Avatar */}
              <Skeleton
                className="
                  size-24 shrink-0 rounded-full border-4 border-background
                  lg:size-32 lg:border-[5px]
                "
              />

              <div className="flex-1 space-y-2 pb-1">
                <Skeleton className="h-8 w-48 lg:h-9" />
                <Skeleton className="h-4 w-28" />
              </div>

              {/* Editar perfil */}
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>

            {/* Bio */}
            <Skeleton className="mt-4 h-4 w-64 lg:mt-5 lg:w-80" />

            {/* Email + join date meta */}
            <div className="mt-3 flex flex-wrap items-center gap-4 lg:mt-4">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-36" />
            </div>

            {/* Stats */}
            <div
              className="
                mt-5 flex items-center justify-center gap-6
                sm:justify-start
                lg:mt-6 lg:gap-10
              "
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <Skeleton className="size-6" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Skeleton className="h-16 w-full rounded-2xl lg:h-20 lg:rounded-3xl" />

        {/* Content grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
