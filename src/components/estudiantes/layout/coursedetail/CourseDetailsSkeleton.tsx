import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';

export function CourseDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto -mt-6 max-w-7xl px-4 py-2 sm:-mt-0 md:px-6 md:py-8 lg:px-8">
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
          className="relative rounded-2xl border p-2 shadow-xl shadow-black/20 backdrop-blur-sm md:p-8"
          style={{
            backgroundColor: '#010b17',
            borderColor: '#061c37cc',
          }}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-background via-background/95 to-background/80"></div>

          <div className="relative z-10 space-y-6">
            {/* Layout Grid - Desktop: 3 cols, Mobile: 1 col */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Mini Card - Mobile Version (Top) */}
              <div className="lg:hidden">
                <div
                  className="relative overflow-hidden rounded-2xl border border-border bg-[#061c37]"
                  style={{ borderColor: '#1d283a', borderWidth: '1px' }}
                >
                  <AspectRatio ratio={16 / 9}>
                    <Skeleton className="h-full w-full bg-[#0a1929]" />
                  </AspectRatio>
                  <div className="space-y-4 p-5">
                    {/* Badge Premium + Pro */}
                    <Skeleton className="h-7 w-40 rounded-full bg-[#1d283a]" />

                    {/* Texto "Incluido en tu plan" */}
                    <Skeleton className="h-5 w-56 bg-[#1d283a]" />

                    {/* Botón Suscrito */}
                    <Skeleton className="h-12 w-full rounded-lg bg-[#1d283a]" />

                    {/* Botón Continuar curso */}
                    <Skeleton className="h-12 w-full rounded-lg bg-[#1d283a]" />
                  </div>
                </div>
              </div>

              {/* Main Content Area - Takes full width on mobile */}
              <div className="lg:col-span-2">
                {/* Top Badge "Desarrollo Web" */}
                <div className="mb-4">
                  <Skeleton className="h-8 w-36 rounded-full bg-[#1d283a]" />
                </div>

                {/* Title */}
                <Skeleton className="mb-4 h-12 w-full max-w-2xl bg-[#1d283a] sm:h-16" />

                {/* Rating and Students */}
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-12 bg-[#1d283a]" />
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-5 w-5 bg-[#1d283a]" />
                      ))}
                    </div>
                    <Skeleton className="h-4 w-24 bg-[#1d283a]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 bg-[#1d283a]" />
                    <Skeleton className="h-4 w-28 bg-[#1d283a]" />
                  </div>
                </div>

                {/* Info Badges Row (6 clases, 40h contenido) */}
                <div className="mb-4 flex flex-wrap gap-3">
                  <Skeleton className="h-9 w-24 rounded-full bg-[#1d283a]" />
                  <Skeleton className="h-9 w-32 rounded-full bg-[#1d283a]" />
                </div>

                {/* Modalidad Badges Row (Básico, Sincrónica, Sábado) */}
                <div className="mb-6 flex flex-wrap gap-3">
                  <Skeleton className="h-9 w-20 rounded-full bg-[#1d283a]" />
                  <Skeleton className="h-9 w-52 rounded-full bg-[#1d283a]" />
                  <Skeleton className="h-9 w-36 rounded-full bg-[#1d283a]" />
                </div>

                {/* Description */}
                <div className="mb-6 space-y-2">
                  <Skeleton className="h-4 w-full bg-[#1d283a]" />
                  <Skeleton className="h-4 w-full bg-[#1d283a]" />
                  <Skeleton className="h-4 w-[90%] bg-[#1d283a]" />
                  <Skeleton className="h-4 w-[95%] bg-[#1d283a]" />
                </div>

                {/* Navigation Pills Carousel */}
                <div className="relative">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {[
                      'Curso',
                      'Clases grabadas',
                      'Proyectos',
                      'Recursos',
                      'Actividades',
                      'Foro',
                    ].map((label, i) => (
                      <Skeleton
                        key={i}
                        className="h-10 min-w-[100px] flex-shrink-0 rounded-full bg-[#1d283a]"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Side Card - Desktop Only */}
              <div className="hidden lg:block">
                <div
                  className="sticky top-24 overflow-hidden rounded-2xl border border-border bg-[#061c37]"
                  style={{ borderColor: '#1d283a', borderWidth: '1px' }}
                >
                  <AspectRatio ratio={16 / 9}>
                    <Skeleton className="h-full w-full bg-[#0a1929]" />
                  </AspectRatio>
                  <div className="space-y-4 p-5">
                    {/* Badge Premium + Pro */}
                    <Skeleton className="h-7 w-40 rounded-full bg-[#1d283a]" />

                    {/* Texto "Incluido en tu plan" */}
                    <Skeleton className="h-5 w-56 bg-[#1d283a]" />

                    {/* Botón Suscrito */}
                    <Skeleton className="h-12 w-full rounded-lg bg-[#1d283a]" />

                    {/* Botón Continuar curso */}
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
