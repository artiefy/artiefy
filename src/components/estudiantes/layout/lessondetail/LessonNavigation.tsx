'use client';

interface LessonWithProgress {
  isLocked: boolean;
  title: string;
  id: number;
}

interface LessonNavigationProps {
  onNavigate: (direction: 'prev' | 'next') => void;
  lessonsState: LessonWithProgress[];
  lessonOrder: number;
  isNavigating: boolean;
  isMobile?: boolean;
}

const LessonNavigation = ({
  onNavigate,
  lessonsState,
  lessonOrder,
  isNavigating,
}: LessonNavigationProps) => {
  // Ordenar lecciones por título
  const sortedLessons = [...lessonsState].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  // Encontrar el índice de la lección actual
  const currentIndex = sortedLessons.findIndex((l) => l.id === lessonOrder);

  // Usar la lección anterior/siguiente sin bloqueo secuencial
  const previousLesson = sortedLessons[currentIndex - 1];
  const nextLesson = sortedLessons[currentIndex + 1];

  const hasPreviousLesson = !!previousLesson;
  const hasNextLesson = !!nextLesson;

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-[#061c37cc] p-1 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => onNavigate('prev')}
        disabled={!hasPreviousLesson || isNavigating}
        style={{ backgroundColor: '#061c37cc' }}
        className={`inline-flex h-8 w-8 items-center justify-center gap-2 rounded-full text-sm font-medium whitespace-nowrap text-slate-200 transition-colors hover:bg-[#1d283a] hover:text-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
          isNavigating ? 'opacity-50' : ''
        }`}
        aria-label="Clase anterior"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w- h-4"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onNavigate('next')}
        disabled={!hasNextLesson || isNavigating}
        style={{ backgroundColor: '#061c37cc' }}
        className={`inline-flex h-8 w-8 items-center justify-center gap-2 rounded-full text-sm font-medium whitespace-nowrap text-slate-200 transition-colors hover:bg-[#1d283a] hover:text-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
          isNavigating ? 'opacity-50' : ''
        }`}
        aria-label="Siguiente clase"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>
  );
};

export default LessonNavigation;
