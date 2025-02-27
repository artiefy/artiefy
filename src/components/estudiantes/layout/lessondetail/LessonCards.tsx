'use client';
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaLock, FaClock } from 'react-icons/fa';
import { toast } from 'sonner';
import { type LessonWithProgress } from '~/types';

interface LessonCardsProps {
	lessonsState: LessonWithProgress[];
	selectedLessonId: number | null;
	setSelectedLessonId: (id: number | null) => void;
	progress: number;
}

const LessonCards = ({
	lessonsState,
	selectedLessonId,
	setSelectedLessonId,
	progress,
}: LessonCardsProps) => {
	const router = useRouter();

	const renderLessonCard = (lessonItem: LessonWithProgress) => {
		const isCurrentLesson = lessonItem.id === selectedLessonId;
		const isAccessible = !lessonItem.isLocked;
		const isCompleted =
			lessonItem.porcentajecompletado === 100 && lessonItem.isCompleted;

		return (
			<div
				key={lessonItem.id}
				onClick={() => {
					if (isAccessible) {
						setSelectedLessonId(lessonItem.id);
						router.push(`/estudiantes/clases/${lessonItem.id}`);
					} else {
						toast.error('Lección bloqueada', {
							description:
								'Completa las lecciones anteriores para desbloquear esta.',
						});
					}
				}}
				className={`mb-2 rounded-lg p-4 transition-all ${isAccessible ? 'cursor-pointer hover:bg-blue-50' : 'cursor-not-allowed opacity-75'} ${isCurrentLesson ? 'border-l-8 border-blue-500 bg-blue-50' : 'bg-gray-50'} ${isCompleted ? 'border-green-500' : ''} `}
			>
				<div className="mb-2 flex items-center justify-between">
					<h3
						className={`font-semibold ${
							isAccessible ? 'text-gray-900' : 'text-gray-500'
						}`}
					>
						{lessonItem.title}
					</h3>
					{isCompleted ? (
						<FaCheckCircle className="text-green-500" />
					) : lessonItem.isLocked ? (
						<FaLock className="text-gray-400" />
					) : (
						<FaClock className="text-gray-400" />
					)}
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
				.sort((a, b) => a.title.localeCompare(b.title)) // Ordenar en orden ascendente por título
				.map(renderLessonCard)}
		</>
	);
};

export default LessonCards;
