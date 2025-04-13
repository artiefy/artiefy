'use client';
import { useEffect, type Dispatch, type SetStateAction } from 'react';

import { FaCheckCircle, FaLock, FaClock } from 'react-icons/fa';
import { toast } from 'sonner';

import { type LessonWithProgress } from '~/types';

interface LessonCardsProps {
	lessonsState: LessonWithProgress[];
	selectedLessonId: number | null;
	onLessonClick: (id: number) => void;
	progress: number;
	isNavigating: boolean;
	setLessonsState: Dispatch<SetStateAction<LessonWithProgress[]>>; // Add this prop
}

const extractLessonNumber = (title: string) => {
	// Handle special case for "Bienvenida"
	if (title.toLowerCase().includes('bienvenida')) return -1;

	// Extract number from titles like "1 Introducción..." or "Clase 1:"
	const match = /^(\d+)/.exec(title);
	return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
};

const LessonCards = ({
	lessonsState,
	selectedLessonId,
	onLessonClick,
	progress,
	isNavigating,
	setLessonsState, // Add this prop
}: LessonCardsProps) => {
	// Remove local state as we'll use the parent's state
	useEffect(() => {
		if (selectedLessonId && progress >= 1) {
			setLessonsState((prev) =>
				prev.map((lesson) =>
					lesson.id === selectedLessonId
						? {
								...lesson,
								isNew: false,
							}
						: lesson
				)
			);
		}
	}, [progress, selectedLessonId, setLessonsState]);

	// Sort the lessons considering "Bienvenida" and numeric order
	const sortedLessons = [...lessonsState].sort((a, b) => {
		const aNum = extractLessonNumber(a.title);
		const bNum = extractLessonNumber(b.title);
		return aNum - bNum;
	});

	// Update the unlocking logic
	useEffect(() => {
		if (selectedLessonId && progress === 100) {
			// Get the current lesson and next lesson
			const currentIndex = sortedLessons.findIndex(
				(l) => l.id === selectedLessonId
			);
			const currentLesson = sortedLessons[currentIndex];
			const nextLesson = sortedLessons[currentIndex + 1];

			if (nextLesson) {
				// Only unlock next lesson if current lesson has no activities or all activities are completed
				const hasActivities =
					currentLesson.activities && currentLesson.activities.length > 0;
				const allActivitiesCompleted = hasActivities
					? currentLesson.activities?.every((activity) => activity.isCompleted)
					: true;

				if (!hasActivities || allActivitiesCompleted) {
					setLessonsState((prev) =>
						prev.map((lesson) =>
							lesson.id === nextLesson.id
								? { ...lesson, isLocked: false, isNew: true }
								: lesson
						)
					);
				}
			}
		}
	}, [progress, selectedLessonId, sortedLessons, setLessonsState]);

	const handleClick = (lessonItem: LessonWithProgress) => {
		if (isNavigating) return; // Prevent clicks while navigating
		if (!lessonItem.isLocked) {
			onLessonClick(lessonItem.id);
		} else {
			toast.error('Clase Bloqueada', {
				description: 'Completa la actividad anterior y desbloquea esta clase.',
			});
		}
	};

	const truncateDescription = (description: string | null, maxLength = 50) => {
		if (!description) return '';
		if (description.length <= maxLength) return description;
		return description.slice(0, maxLength).trim() + '...';
	};

	const renderProgressBar = (lessonItem: LessonWithProgress) => {
		const isCurrentLesson = lessonItem.id === selectedLessonId;
		const currentProgress = isCurrentLesson
			? progress
			: lessonItem.porcentajecompletado;

		return (
			<div className="relative h-2 rounded bg-gray-200">
				<div
					className="absolute h-2 rounded bg-blue-500 transition-all duration-300 ease-in-out"
					style={{
						width: `${currentProgress}%`,
					}}
				/>
			</div>
		);
	};

	const renderLessonCard = (lessonItem: LessonWithProgress, index: number) => {
		const isCurrentLesson = lessonItem.id === selectedLessonId;
		const previousLesson = index > 0 ? sortedLessons[index - 1] : null;

		// A lesson should be accessible if:
		// 1. It's the first lesson (Bienvenida or Lesson 1)
		// 2. It's explicitly unlocked in the database
		// 3. The previous lesson is completed and has no pending activities
		const isAccessible =
			index === 0 ||
			(!lessonItem.isLocked &&
				(!previousLesson ||
					(previousLesson.porcentajecompletado === 100 &&
						(!previousLesson.activities?.length ||
							previousLesson.activities.every((a) => a.isCompleted)))));

		const isCompleted = lessonItem.porcentajecompletado === 100;
		const shouldShowNew =
			!lessonItem.isLocked &&
			lessonItem.isNew &&
			(isCurrentLesson
				? progress === 0
				: lessonItem.porcentajecompletado === 0);

		return (
			<div
				key={lessonItem.id}
				onClick={() => handleClick(lessonItem)}
				className={`mb-2 rounded-lg p-4 transition-transform duration-200 ease-in-out ${isNavigating ? 'cursor-not-allowed opacity-50' : ''} ${
					isAccessible
						? 'cursor-pointer hover:scale-[1.01] hover:transform'
						: 'cursor-not-allowed opacity-75'
				} ${isCurrentLesson ? 'border-l-8 border-blue-500 bg-blue-50' : 'bg-gray-50'} ${isCompleted ? 'border-green-500' : ''} ${shouldShowNew ? 'ring-2 ring-green-400' : ''}`}
			>
				<div className="mb-2 flex items-center justify-between">
					<h3
						className={`font-semibold ${
							isAccessible ? 'text-gray-900' : 'text-gray-500'
						}`}
					>
						{lessonItem.title}
					</h3>
					<div className="flex items-center space-x-2">
						{shouldShowNew && (
							<span className="relative [animation:nuevo-badge-pulse_1.5s_infinite_ease-in-out] rounded bg-green-500 px-2 py-1 text-xs text-white">
								Nueva
							</span>
						)}
						{isCompleted ? (
							<FaCheckCircle className="text-green-500" />
						) : lessonItem.isLocked ? (
							<FaLock className="text-gray-400" />
						) : (
							<FaClock className="text-gray-400" />
						)}
					</div>
				</div>
				<p className="mb-2 line-clamp-1 text-sm text-gray-600">
					{truncateDescription(lessonItem.description)}
				</p>
				{renderProgressBar(lessonItem)}
				<div className="mt-2 flex justify-between text-xs text-gray-500">
					<span>{lessonItem.duration} mins</span>
					<span>
						{isCurrentLesson ? progress : lessonItem.porcentajecompletado}%
					</span>
				</div>
			</div>
		);
	};

	return (
		<>{sortedLessons.map((lesson, index) => renderLessonCard(lesson, index))}</>
	);
};

export default LessonCards;
