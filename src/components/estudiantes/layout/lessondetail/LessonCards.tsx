'use client';
import { FaCheckCircle, FaLock, FaClock } from 'react-icons/fa';
import { toast } from 'sonner';

import { type LessonWithProgress } from '~/types';

interface LessonCardsProps {
	lessonsState: LessonWithProgress[];
	selectedLessonId: number | null;
	onLessonClick: (id: number) => void;
	progress: number;
	isNavigating: boolean; // Add new prop
}

const LessonCards = ({
	lessonsState,
	selectedLessonId,
	onLessonClick,
	progress,
	isNavigating,
}: LessonCardsProps) => {
	const handleClick = (lessonItem: LessonWithProgress) => {
		if (isNavigating) return; // Prevent clicks while navigating
		if (!lessonItem.isLocked) {
			onLessonClick(lessonItem.id);
		} else {
			toast.error('Clase Bloqueada', {
				description: 'Debes completar las clases anteriores primero.',
			});
		}
	};

	const renderLessonCard = (lessonItem: LessonWithProgress) => {
		const isCurrentLesson = lessonItem.id === selectedLessonId;
		const isAccessible = !lessonItem.isLocked;
		const isCompleted =
			lessonItem.porcentajecompletado === 100 && lessonItem.isCompleted;

		return (
			<div
				key={lessonItem.id}
				onClick={() => handleClick(lessonItem)}
				className={`mb-2 rounded-lg p-4 transition-transform duration-200 ease-in-out ${isNavigating ? 'cursor-not-allowed opacity-50' : ''} ${
					isAccessible
						? 'cursor-pointer hover:scale-[1.01] hover:transform'
						: 'cursor-not-allowed opacity-75'
				} ${isCurrentLesson ? 'border-l-8 border-blue-500 bg-blue-50' : 'bg-gray-50'} ${isCompleted ? 'border-green-500' : ''} `}
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
						{isAccessible &&
							lessonItem.isNew &&
							lessonItem.porcentajecompletado === 0 && (
								<span className="rounded bg-green-500 px-2 py-1 text-xs text-white">
									Nuevo
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
				<p className="mb-2 text-sm text-gray-600">{lessonItem.description}</p>
				<div className="relative h-2 rounded bg-gray-200">
					<div
						className="absolute h-2 rounded bg-blue-500"
						style={{
							width: `${isCurrentLesson ? progress : lessonItem.porcentajecompletado}%`,
						}}
					/>
				</div>
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
		<>
			{lessonsState
				.sort(
					(a, b) =>
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
				)
				.map(renderLessonCard)}
		</>
	);
};

export default LessonCards;
