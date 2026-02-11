import Link from 'next/link';

import { ChevronRight } from 'lucide-react';

interface NextLessonModalProps {
  nextLesson: {
    id: number;
    title: string;
    isLocked: boolean;
  } | null;
  courseId: number;
}

export function NextLessonModal({
  nextLesson,
  courseId,
}: NextLessonModalProps) {
  if (!nextLesson) return null;

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <div
        className="hidden items-center gap-4 rounded-2xl border-2 border-border p-4 pr-6 shadow-xl backdrop-blur-xl sm:flex"
        style={{ backgroundColor: '#061c37f2' }}
      >
        <Link
          href={`/estudiantes/clases/${nextLesson.id}`}
          className="flex items-center"
          aria-label={`Ir a ${nextLesson.title}`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-green-500 bg-green-600/30 transition-transform duration-200 hover:scale-110">
            <ChevronRight className="h-6 w-6 text-green-400 transition-transform duration-200 hover:scale-110" />
          </div>
        </Link>
        <div className="min-w-0">
          <p className="mb-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Disponible
          </p>
          <p className="max-w-[200px] truncate text-sm font-medium text-foreground">
            {nextLesson.title}
          </p>
        </div>
      </div>
      <Link
        href={`/estudiantes/clases/${nextLesson.id}`}
        className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-green-500 bg-green-600/30 transition-transform duration-200 hover:scale-110 sm:hidden"
        aria-label={`Ir a ${nextLesson.title}`}
      >
        <ChevronRight className="h-6 w-6 text-green-400 transition-transform duration-200 hover:scale-110" />
      </Link>
    </div>
  );
}
