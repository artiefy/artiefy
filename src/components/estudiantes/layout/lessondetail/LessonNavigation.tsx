"use client";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

import { Button } from "~/components/estudiantes/ui/button";

interface LessonWithProgress {
  isLocked: boolean;
  title: string;
  id: number;
}

interface LessonNavigationProps {
  onNavigate: (direction: "prev" | "next") => void;
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
  // Ordenar lecciones por título (puedes cambiar por sortLessons si lo prefieres)
  const sortedLessons = [...lessonsState].sort((a, b) =>
    a.title.localeCompare(b.title),
  );

  // Encontrar el índice de la lección actual
  const currentIndex = sortedLessons.findIndex((l) => l.id === lessonOrder);

  // Buscar la lección anterior desbloqueada
  const previousLesson = sortedLessons
    .slice(0, currentIndex)
    .reverse()
    .find((lesson) => !lesson.isLocked);

  // Buscar la siguiente lección desbloqueada
  const nextLesson = sortedLessons
    .slice(currentIndex + 1)
    .find((lesson) => !lesson.isLocked);

  // Determinar si los botones deben estar habilitados
  const hasPreviousLesson = !!previousLesson;
  const hasNextLesson = !!nextLesson;

  return (
    <div className="mb-2 flex flex-col gap-2 md:mb-4 md:flex-row md:justify-between md:gap-0">
      <Button
        onClick={() => onNavigate("prev")}
        disabled={!hasPreviousLesson || isNavigating}
        className={`flex w-full items-center gap-2 active:scale-95 md:w-auto ${
          isNavigating ? "opacity-50" : ""
        }`}
        variant="outline"
      >
        <FaArrowLeft /> Clase Anterior
      </Button>
      <Button
        onClick={() => onNavigate("next")}
        disabled={!hasNextLesson || isNavigating}
        className={`flex w-full items-center gap-2 active:scale-95 md:w-auto ${
          isNavigating ? "opacity-50" : ""
        }`}
        variant="outline"
      >
        Siguiente Clase <FaArrowRight />
      </Button>
    </div>
  );
};

export default LessonNavigation;
