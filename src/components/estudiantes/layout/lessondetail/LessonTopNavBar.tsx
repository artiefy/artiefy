'use client';

import Link from 'next/link';

import LessonNavigation from './LessonNavigation';

interface LessonWithProgress {
  isLocked: boolean;
  title: string;
  id: number;
}

interface LessonTopNavBarProps {
  courseId: number;
  courseTitle: string;
  currentLessonIndex: number;
  totalLessons: number;
  progress: number;
  isCompleted: boolean;
  onComplete: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  lessonsState: LessonWithProgress[];
  lessonOrder: number;
  isNavigating: boolean;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  completedCount?: number;
  totalLessonsCount?: number;
}

const LessonTopNavBar = ({
  courseId,
  courseTitle,
  currentLessonIndex,
  totalLessons,
  progress,
  isCompleted,
  onComplete: _onComplete,
  onNavigate,
  lessonsState,
  lessonOrder,
  isNavigating,
  onToggleSidebar,
  isSidebarOpen = true,
  completedCount = 0,
  totalLessonsCount = 0,
}: LessonTopNavBarProps) => {
  // Calcular cuántas barras están completadas basado en el progreso
  const completedBars = Math.round((currentLessonIndex / totalLessons) * 22);

  return (
    <div className="fixed top-16 right-0 left-0 z-[60] w-full px-4 py-2">
      <div className="mx-auto grid max-w-[1800px] grid-cols-1 items-center gap-3 md:grid-cols-[auto_1fr_auto] md:gap-4">
        {/* Left: Close button */}
        <div className="flex min-w-0 items-center gap-2">
          {/* Desktop close X */}
          <button
            type="button"
            onClick={onToggleSidebar}
            style={{ backgroundColor: '#061c37cc' }}
            className="hidden h-10 w-10 items-center justify-center gap-2 rounded-full border border-border/50 bg-primary text-sm font-medium whitespace-nowrap backdrop-blur-xl transition-colors hover:bg-purple-600 hover:text-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:flex"
            aria-label="Close sidebar"
          >
            {isSidebarOpen ? (
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
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            ) : (
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
                className="h-5 w-5"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            )}
          </button>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={onToggleSidebar}
            style={{ backgroundColor: '#061c37cc' }}
            className="inline-flex h-10 w-10 items-center justify-center gap-2 rounded-full border border-border/50 bg-primary text-sm font-medium whitespace-nowrap backdrop-blur-xl transition-colors hover:bg-purple-600 hover:text-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:hidden"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
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
                className="h-5 w-5"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            ) : (
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
                className="h-5 w-5"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            )}
          </button>

          {/* Back arrow + Course name */}
          <Link
            href={`/estudiantes/cursos/${courseId}`}
            style={{ backgroundColor: '#061c37cc' }}
            className="group hidden min-w-0 items-center gap-2 rounded-full border border-border/50 bg-primary px-4 py-2.5 backdrop-blur-xl transition-all hover:bg-card md:flex"
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
              className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span
              className="max-w-[220px] truncate text-sm font-medium text-foreground"
              title={courseTitle}
              aria-label={courseTitle}
            >
              {courseTitle}
            </span>
          </Link>
        </div>

        {/* Center: Progress indicator */}
        <div className="hidden min-w-0 items-center gap-3 md:flex md:justify-center">
          {/* Progress bars */}
          <div
            style={{ backgroundColor: '#061c37cc' }}
            className="flex min-w-0 items-center gap-3 rounded-full border border-border/50 bg-[#061c37cc] px-4 py-2.5 backdrop-blur-xl"
          >
            <span className="text-xs whitespace-nowrap text-muted-foreground">
              {currentLessonIndex} / {totalLessons}
            </span>
            <div className="relative flex items-center gap-1 overflow-hidden">
              {/* Progress bars */}
              {Array.from({ length: 22 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-3 rounded-full transition-all duration-300 md:w-4 lg:w-5 xl:w-6 ${
                    i < completedBars ? 'bg-primary' : 'bg-[#1d283a]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Complete button + Navigation */}
        <div className="flex flex-nowrap items-center gap-2 justify-self-end">
          {/* Complete button */}
          <button
            type="button"
            onClick={() => {
              if (!isCompleted) {
                _onComplete();
              }
            }}
            disabled={isCompleted}
            style={{ backgroundColor: '#061c37cc' }}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap backdrop-blur-xl transition-all [&_svg]:size-4 [&_svg]:shrink-0 ${
              isCompleted
                ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                : 'border-border/50 bg-card/80 text-foreground hover:scale-105'
            }`}
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
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span className="hidden text-sm font-medium sm:inline">
              {isCompleted ? 'Completada' : 'Completar'}
            </span>
          </button>

          {/* Navigation buttons */}
          <LessonNavigation
            onNavigate={onNavigate}
            lessonsState={lessonsState}
            lessonOrder={lessonOrder}
            isNavigating={isNavigating}
          />
        </div>
      </div>
    </div>
  );
};

export default LessonTopNavBar;
