import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';

export function GuidedProjectDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <main
        className="
          mx-auto -mt-6 max-w-7xl px-4 py-2
          sm:-mt-0
          md:px-6 md:py-8
          lg:px-8
        "
      >
        {/* Breadcrumb Skeleton */}
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-4 w-16 bg-[#1d283a]" />
          <Skeleton className="h-4 w-1 bg-[#1d283a]" />
          <Skeleton className="h-4 w-20 bg-[#1d283a]" />
          <Skeleton className="h-4 w-1 bg-[#1d283a]" />
          <Skeleton className="h-4 w-64 bg-[#1d283a]" />
        </div>

        {/* Main Card Container */}
        <div
          className="
            relative rounded-2xl border p-2 shadow-xl shadow-black/20
            backdrop-blur-sm
            md:p-8
          "
          style={{
            backgroundColor: '#010b17',
            borderColor: '#061c37cc',
          }}
        >
          <div
            className="
              absolute inset-0 rounded-2xl bg-gradient-to-r from-background
              via-background/95 to-background/80
            "
          ></div>

          <div className="relative z-10 space-y-6">
            <div
              className="
                grid grid-cols-1 gap-8
                lg:grid-cols-3
              "
            >
              <div className="lg:hidden">
                <div
                  className="
                    relative overflow-hidden rounded-2xl border border-border
                    bg-[#061c37]
                  "
                  style={{ borderColor: '#1d283a', borderWidth: '1px' }}
                >
                  <AspectRatio ratio={16 / 9}>
                    <Skeleton className="size-full bg-[#0a1929]" />
                  </AspectRatio>
                  <div className="space-y-4 p-5">
                    <Skeleton className="h-7 w-40 rounded-full bg-[#1d283a]" />
                    <Skeleton className="h-5 w-56 bg-[#1d283a]" />
                    <Skeleton className="h-12 w-full rounded-lg bg-[#1d283a]" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="mb-4">
                  <Skeleton className="h-8 w-36 rounded-full bg-[#1d283a]" />
                </div>
                <Skeleton className="mb-4 h-12 w-full max-w-2xl bg-[#1d283a] sm:h-16" />
                <div className="mb-6 space-y-2">
                  <Skeleton className="h-4 w-full bg-[#1d283a]" />
                  <Skeleton className="h-4 w-full bg-[#1d283a]" />
                  <Skeleton className="h-4 w-[90%] bg-[#1d283a]" />
                </div>
                <div className="relative">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {['Proyecto', 'Actividades', 'Foro'].map((label, i) => (
                      <Skeleton
                        key={i}
                        className="
                          h-10 min-w-[100px] flex-shrink-0 rounded-full
                          bg-[#1d283a]
                        "
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div
                className="
                  hidden
                  lg:block
                "
              >
                <div
                  className="
                    sticky top-24 overflow-hidden rounded-2xl border
                    border-border bg-[#061c37]
                  "
                  style={{ borderColor: '#1d283a', borderWidth: '1px' }}
                >
                  <AspectRatio ratio={16 / 9}>
                    <Skeleton className="size-full bg-[#0a1929]" />
                  </AspectRatio>
                  <div className="space-y-4 p-5">
                    <Skeleton className="h-7 w-40 rounded-full bg-[#1d283a]" />
                    <Skeleton className="h-5 w-56 bg-[#1d283a]" />
                    <Skeleton className="h-12 w-full rounded-lg bg-[#1d283a]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
