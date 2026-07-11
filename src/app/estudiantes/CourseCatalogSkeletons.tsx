import { Skeleton } from '~/components/estudiantes/ui/skeleton';

// Shared loading skeletons for the /estudiantes catalog. Each block mirrors the
// exact container classes of the real components (StudentDetails hero + filter
// bar + Top Cursos carousel, and the StudentListCourses grid) so the layout
// does not shift — at both desktop and mobile breakpoints — when the streamed
// content replaces the fallback.

// Mirrors a single StudentListCourses card: h-40 cover + p-4 content stack.
export function CourseCardSkeleton() {
  return (
    <div className="relative">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card">
        <Skeleton className="h-40 w-full rounded-none" />
        <div className="flex flex-1 flex-col gap-2 p-4">
          {/* Title (line-clamp-2) */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          {/* Instructor */}
          <Skeleton className="mt-0.5 h-3.5 w-1/2" />
          {/* Modalidad + nivel badges */}
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          {/* Category pill */}
          <Skeleton className="h-5 w-24 rounded-full" />
          {/* Footer (date / rating) */}
          <Skeleton className="mt-auto h-4 w-16 pt-2" />
        </div>
      </div>
    </div>
  );
}

// Mirrors the StudentListCourses grid wrapper: same columns, gaps and padding.
export function CourseGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 px-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-26">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Mirrors the StudentListCourses header row: "Cursos Artie" title + sort control.
function CoursesListHeaderSkeleton() {
  return (
    <div className="mt-8 mb-3 flex flex-col gap-4 px-8 sm:mb-3 sm:flex-row sm:items-center sm:gap-6 lg:px-26">
      <Skeleton className="h-8 w-40 shrink-0" />
      <div className="w-full sm:ml-auto sm:w-[320px] lg:w-[360px]">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

// Mirrors the search hero: heading, subtitle, search bar and sub-text.
function SearchHeroSkeleton() {
  return (
    <div className="mt-16 flex flex-col items-center space-y-4 px-2 sm:mt-8 sm:px-0 lg:mt-24">
      <div className="flex flex-col items-center gap-2 text-center">
        <Skeleton className="h-9 w-56 sm:h-11 sm:w-72" />
        <Skeleton className="mt-2 h-4 w-72 sm:mt-3 sm:h-5 sm:w-96" />
      </div>
      <Skeleton className="h-12 w-full max-w-xl rounded-full" />
      <Skeleton className="mt-3 h-4 w-60" />
    </div>
  );
}

// Mirrors the horizontal filter menu (border-y band with pill buttons).
function FilterBarSkeleton() {
  return (
    <div className="border-y border-border/30 py-4">
      <div className="px-4 sm:px-24">
        <div className="flex items-center gap-2 overflow-hidden py-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Mirrors a titled carousel row (Top Cursos / Programas): heading + h-56 cards.
function CarouselRowSkeleton() {
  return (
    <div className="relative pr-0 pl-4 sm:px-24">
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="size-6 rounded-md" />
        <Skeleton className="h-8 w-44" />
      </div>
      <div className="flex gap-x-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-56 shrink-0 basis-[85%] rounded-2xl sm:basis-[60%] md:basis-1/3 lg:basis-[28%]"
          />
        ))}
      </div>
    </div>
  );
}

// Mirrors the StudentCategories chips grid.
export function CategoriesSkeleton() {
  return (
    <div className="px-8 sm:px-12 md:px-10 lg:px-20">
      <Skeleton className="mt-4 mb-2 h-8 w-56" />
      <div className="flex gap-3 overflow-hidden pb-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-full" />
        ))}
      </div>
    </div>
  );
}

// Fallback for the StudentDetails Suspense boundary: hero + filters + Top Cursos.
export function StudentDetailsSkeleton() {
  return (
    <div className="flex w-full max-w-full flex-col overflow-x-hidden">
      <div className="flex flex-col space-y-12 sm:space-y-16">
        <SearchHeroSkeleton />
        <FilterBarSkeleton />
        <CarouselRowSkeleton />
      </div>
    </div>
  );
}

// Full-page fallback used by loading.tsx (browser refresh / hard navigation).
export function CatalogPageSkeleton() {
  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden">
      <StudentDetailsSkeleton />
      <CoursesListHeaderSkeleton />
      <CourseGridSkeleton count={12} />
    </div>
  );
}
