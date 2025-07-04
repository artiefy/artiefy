'use client';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

import { Button } from '~/components/estudiantes/ui/button';

interface LessonWithProgress {
  isLocked: boolean;
  title: string;
  id: number;
}

interface LessonNavigationProps {
  onNavigate: (direction: 'prev' | 'next') => void;
  lessonsState: LessonWithProgress[];
  lessonOrder: number;
  isNavigating: boolean; // Add new prop
  isMobile?: boolean; // <-- nuevo prop
}

const LessonNavigation = ({
  onNavigate,
  lessonsState,
  lessonOrder,
  isNavigating,
}: LessonNavigationProps) => {
  // Sort lessons by title
  const sortedLessons = [...lessonsState].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  // Find current index using lessonOrder
  const currentIndex = sortedLessons.findIndex((l) => l.id === lessonOrder);

  // Check for available lessons before/after current
  const hasPreviousLesson = sortedLessons
    .slice(0, currentIndex)
    .some((lesson) => !lesson.isLocked);

  const hasNextLesson = sortedLessons
    .slice(currentIndex + 1)
    .some((lesson) => !lesson.isLocked);

  return (
    <div className="mb-2 flex flex-col gap-2 md:mb-4 md:flex-row md:justify-between md:gap-0">
      <Button
        onClick={() => onNavigate('prev')}
        disabled={!hasPreviousLesson || isNavigating}
        className={`flex w-full items-center gap-2 active:scale-95 md:w-auto ${
          isNavigating ? 'opacity-50' : ''
        }`}
        variant="outline"
      >
        <FaArrowLeft /> Clase Anterior
      </Button>
      <Button
        onClick={() => onNavigate('next')}
        disabled={!hasNextLesson || isNavigating}
        className={`flex w-full items-center gap-2 active:scale-95 md:w-auto ${
          isNavigating ? 'opacity-50' : ''
        }`}
        variant="outline"
      >
        Siguiente Clase <FaArrowRight />
      </Button>
    </div>
  );
};

export default LessonNavigation;
