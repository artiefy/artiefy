import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { Button } from '~/components/estudiantes/ui/button';

interface LessonWithProgress {
  isLocked: boolean;
  // Add other properties if needed
}

interface LessonNavigationProps {
  handleNavigation: (direction: 'prev' | 'next') => void;
  lessonsState: LessonWithProgress[];
  lessonOrder: number;
}

const LessonNavigation = ({
  handleNavigation,
  lessonsState,
  lessonOrder,
}: LessonNavigationProps) => {
  return (
    <div className="mb-4 flex justify-between">
      <Button
        onClick={() => handleNavigation('prev')}
        disabled={!lessonsState.some((l, i) => i < lessonOrder - 1 && !l.isLocked)}
        className="flex items-center gap-2 active:scale-95"
        variant="outline"
      >
        <FaArrowLeft /> Lección Anterior
      </Button>
      <Button
        onClick={() => handleNavigation('next')}
        disabled={!lessonsState.some((l, i) => i > lessonOrder - 1 && !l.isLocked)}
        className="flex items-center gap-2 active:scale-95"
        variant="outline"
      >
        Siguiente Lección <FaArrowRight />
      </Button>
    </div>
  );
};

export default LessonNavigation;
