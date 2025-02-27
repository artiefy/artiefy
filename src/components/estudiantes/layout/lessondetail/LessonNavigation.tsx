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
}

const LessonNavigation = ({
	onNavigate,
	lessonsState,
	lessonOrder,
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
		<div className="mb-4 flex justify-between">
			<Button
				onClick={() => onNavigate('prev')}
				disabled={!hasPreviousLesson}
				className="flex items-center gap-2 active:scale-95"
				variant="outline"
			>
				<FaArrowLeft /> Clase Anterior
			</Button>
			<Button
				onClick={() => onNavigate('next')}
				disabled={!hasNextLesson}
				className="flex items-center gap-2 active:scale-95"
				variant="outline"
			>
				Siguiente Clase <FaArrowRight />
			</Button>
		</div>
	);
};

export default LessonNavigation;
