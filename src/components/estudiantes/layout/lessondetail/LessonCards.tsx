'use client';
import { useEffect, type Dispatch, type SetStateAction } from 'react';

import { FaCheckCircle, FaLock, FaClock } from 'react-icons/fa';
import { toast } from 'sonner';
import useSWR from 'swr';

import { type LessonWithProgress } from '~/types';
import { sortLessons } from '~/utils/lessonSorting';

interface LessonCardsProps {
	lessonsState: LessonWithProgress[];
	selectedLessonId: number | null;
	onLessonClick: (id: number) => void;
	progress: number;
	isNavigating: boolean;
	setLessonsState: Dispatch<SetStateAction<LessonWithProgress[]>>; // Add this prop
}

interface NextLessonStatus {
	lessonId: number | null;
	isUnlocked: boolean;
}

interface ApiResponse {
	lessonId: number | null;
	isUnlocked: boolean;
}

const fetcher = async (url: string): Promise<NextLessonStatus> => {
	const res = await fetch(url);
	if (!res.ok) throw new Error('Failed to fetch lesson status');
	const data = (await res.json()) as ApiResponse;
	return {
		isUnlocked: Boolean(data.isUnlocked),
		lessonId: data.lessonId,
	};
};

const LessonCards = ({
	lessonsState,
	selectedLessonId,
	onLessonClick,
	progress,
	isNavigating,
	setLessonsState, // Add this prop
}: LessonCardsProps) => {
	// Add SWR hook to automatically check lesson status
	const { data: nextLessonStatus, mutate } = useSWR<NextLessonStatus>(
		selectedLessonId && progress === 100
			? `/api/lessons/${selectedLessonId}/next-lesson-status`
			: null,
		fetcher,
		{
			refreshInterval: 0,
			revalidateOnFocus: false,
		}
	);

	// First useEffect with corrected dependencies and optional chaining
	useEffect(() => {
		if (selectedLessonId && progress >= 1) {
			const currentLesson = lessonsState.find((l) => l.id === selectedLessonId);
			if (currentLesson?.isNew) {
				setLessonsState((prev) =>
					prev.map((lesson) =>
						lesson.id === selectedLessonId
							? { ...lesson, isNew: false }
							: lesson
					)
				);
			}
		}
	}, [selectedLessonId, progress, setLessonsState, lessonsState]);

	// Modified unlocking effect with real-time updates
	useEffect(() => {
		const unlockNextLesson = async () => {
			if (!selectedLessonId || progress < 100) return;

			const sortedLessons = sortLessons(lessonsState);
			const currentIndex = sortedLessons.findIndex(
				(l) => l.id === selectedLessonId
			);
			const currentLesson = sortedLessons[currentIndex];
			const nextLesson = sortedLessons[currentIndex + 1];

			if (!nextLesson?.isLocked) return; // Skip if next lesson is already unlocked

			const activities = currentLesson?.activities ?? [];
			const hasActivities = activities.length > 0;
			const allActivitiesCompleted = hasActivities
				? activities.every((activity) => activity.isCompleted)
				: true;

			// Unlock next lesson if video is complete AND (no activities OR all activities completed)
			if (progress === 100 && (!hasActivities || allActivitiesCompleted)) {
				try {
					// Update database first
					const response = await fetch('/api/lessons/unlock', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							lessonId: nextLesson.id,
							currentLessonId: selectedLessonId,
						}),
					});

					if (!response.ok) throw new Error('Failed to unlock lesson');

					// If database update successful, update UI state
					setLessonsState((prev) =>
						prev.map((lesson) =>
							lesson.id === nextLesson.id
								? { ...lesson, isLocked: false, isNew: true }
								: lesson
						)
					);

					// Revalidate next lesson status
					await mutate();

					// Show success notification
					toast.success('¡Nueva clase desbloqueada!', {
						description: 'Ya puedes acceder a la siguiente clase.',
					});
				} catch (error) {
					console.error('Error unlocking next lesson:', error);
					toast.error('Error al desbloquear la siguiente clase');
				}
			}
		};

		void unlockNextLesson();
	}, [selectedLessonId, progress, lessonsState, setLessonsState, mutate]);

	// Update lessons state when nextLessonStatus changes
	useEffect(() => {
		if (nextLessonStatus?.isUnlocked && nextLessonStatus.lessonId !== null) {
			setLessonsState((prev) =>
				prev.map((lesson) =>
					lesson.id === nextLessonStatus.lessonId
						? { ...lesson, isLocked: false, isNew: true }
						: lesson
				)
			);
		}
	}, [nextLessonStatus, setLessonsState]);

	// Sort lessons for rendering
	const sortedLessons = sortLessons(lessonsState);

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

	const getActivityStatus = (lessonItem: LessonWithProgress) => {
		// Always check isLocked first
		if (lessonItem.isLocked === true) {
			return {
				icon: <FaLock className="text-gray-400" />,
				isAccessible: false,
				className: 'cursor-not-allowed bg-gray-50 opacity-75',
			};
		}

		// Only if explicitly unlocked (isLocked === false), check other conditions
		if (lessonItem.porcentajecompletado === 100) {
			return {
				icon: <FaCheckCircle className="text-green-500" />,
				isAccessible: true,
				className: 'cursor-pointer bg-white hover:scale-[1.01] hover:transform',
			};
		}

		return {
			icon: <FaClock className="text-gray-400" />,
			isAccessible: true,
			className: 'cursor-pointer bg-white hover:scale-[1.01] hover:transform',
		};
	};

	const renderLessonCard = (lessonItem: LessonWithProgress) => {
		const isCurrentLesson = lessonItem.id === selectedLessonId;
		const status = getActivityStatus(lessonItem);
		const shouldShowNew =
			lessonItem.isLocked === false && // Explicitly check for false
			lessonItem.isNew &&
			(isCurrentLesson
				? progress === 0
				: lessonItem.porcentajecompletado === 0);

		return (
			<div
				key={lessonItem.id}
				onClick={() => handleClick(lessonItem)}
				className={`mb-2 rounded-lg p-4 transition-transform duration-200 ease-in-out ${
					isNavigating ? 'cursor-not-allowed opacity-50' : ''
				} ${status.className} ${
					isCurrentLesson ? 'border-l-8 border-blue-500 bg-blue-50' : ''
				} ${shouldShowNew ? 'ring-2 ring-green-400' : ''}`}
			>
				<div className="mb-2 flex items-center justify-between">
					<h3
						className={`font-semibold ${
							status.isAccessible ? 'text-gray-900' : 'text-gray-500'
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
						{status.icon}
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

	return <>{sortedLessons.map((lesson) => renderLessonCard(lesson))}</>;
};

export default LessonCards;
