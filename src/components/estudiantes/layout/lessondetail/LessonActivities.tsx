import { useState, useEffect, useCallback } from 'react';

import Link from 'next/link';

import { FaCheckCircle, FaLock, FaArrowDown, FaTrophy } from 'react-icons/fa';
import { PiArrowFatLinesLeft } from 'react-icons/pi';
import { toast } from 'sonner';

import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';

import LessonActivityModal from './LessonActivityModal';

import type { Activity, SavedAnswer } from '~/types';

interface LessonActivitiesProps {
	activity: Activity | null;
	isVideoCompleted: boolean;
	isActivityCompleted: boolean;
	handleActivityCompletion: () => Promise<void>;
	userId: string;
	nextLessonId?: number;
	onLessonUnlocked: (lessonId: number) => void;
	courseId: number; // Add this new prop
	isLastLesson: boolean; // Add this prop
}

interface SavedResults {
	score: number;
	answers: Record<string, SavedAnswer>;
	isAlreadyCompleted?: boolean;
}

interface CourseGradeSummary {
	finalGrade: number;
	parameters: {
		name: string;
		grade: number;
		weight: number;
	}[];
	isCompleted: boolean;
}

// Add type for API response
interface GradeSummaryResponse {
	finalGrade: number;
	parameters: {
		name: string;
		grade: number;
		weight: number;
	}[];
	isCompleted: boolean;
}

// Add interface for API response
interface GetAnswersResponse {
	score: number;
	answers: Record<string, SavedAnswer>;
	isAlreadyCompleted: boolean;
}

const LessonActivities = ({
	activity,
	isVideoCompleted,
	isActivityCompleted,
	handleActivityCompletion,
	userId,
	nextLessonId,
	onLessonUnlocked,
	courseId, // Add this new prop
	isLastLesson, // Add this prop
}: LessonActivitiesProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [activityCompleted, setActivityCompleted] =
		useState(isActivityCompleted);

	const [savedResults, setSavedResults] = useState<SavedResults | null>(null);
	const [isLoadingResults, setIsLoadingResults] = useState(false);
	const [gradeSummary, setGradeSummary] = useState<CourseGradeSummary | null>(
		null
	);

	// Add new state for activity loading
	const [isLoadingActivity, setIsLoadingActivity] = useState(false);

	const openModal = () => setIsModalOpen(true);
	const closeModal = () => setIsModalOpen(false);

	const handleQuestionsAnswered = (answered: boolean) => {
		// Solo actualizar el estado local si es necesario
		setActivityCompleted(answered);
	};

	const markActivityAsCompleted = async (): Promise<void> => {
		setActivityCompleted(true);
		return Promise.resolve();
	};

	const fetchGradeSummary = useCallback(async () => {
		try {
			const response = await fetch(
				`/api/grades/summary?courseId=${courseId}&userId=${userId}`
			);
			if (response.ok) {
				const data = (await response.json()) as GradeSummaryResponse;
				setGradeSummary({
					finalGrade: data.finalGrade,
					parameters: data.parameters,
					isCompleted: data.isCompleted,
				});
			}
		} catch (error) {
			console.error('Error fetching grade summary:', error);
		}
	}, [courseId, userId]);

	useEffect(() => {
		void fetchGradeSummary();
	}, [fetchGradeSummary]);

	const handleCompletedActivityClick = async () => {
		setIsLoadingResults(true);
		try {
			// Check if activity exists and get its ID safely
			const activityId = activity?.id;
			if (!activityId) return;

			const response = await fetch(
				`/api/activities/getAnswers?activityId=${activityId}&userId=${userId}`
			);

			if (response.ok) {
				const data = (await response.json()) as GetAnswersResponse;
				setSavedResults({
					score: data.score,
					answers: data.answers,
					isAlreadyCompleted: true,
				});
				setActivityCompleted(true); // Set activity as completed
			}
		} catch (error) {
			console.error('Error fetching saved results:', error);
			toast.error('Error al cargar los resultados guardados');
		} finally {
			setIsLoadingResults(false);
			openModal();
		}
	};

	// Add new handler for opening activity
	const handleOpenActivity = () => {
		setIsLoadingActivity(true);
		try {
			openModal();
		} finally {
			setIsLoadingActivity(false);
		}
	};

	const renderGradeSummary = () => {
		if (!gradeSummary?.isCompleted) return null;

		return (
			<div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-semibold text-gray-900">
						Resumen de Calificaciones
					</h3>
					<FaTrophy className="text-2xl text-yellow-500" />
				</div>

				<div className="space-y-3">
					{gradeSummary.parameters.map((param, index) => (
						<div key={index} className="flex justify-between text-sm">
							<span className="text-gray-600">
								{param.name} ({param.weight}%)
							</span>
							<span className="font-medium text-gray-900">
								{param.grade.toFixed(1)}
							</span>
						</div>
					))}

					<div className="mt-4 border-t border-gray-100 pt-3">
						<div className="flex justify-between">
							<span className="font-semibold text-gray-900">
								Nota Final del Curso
							</span>
							<span className="text-lg font-bold text-primary">
								{gradeSummary.finalGrade.toFixed(1)}
							</span>
						</div>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="w-72 p-4">
			<h2 className="mb-4 text-2xl font-bold text-primary">Actividades</h2>
			{activity ? (
				<div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-semibold text-gray-900">{activity.name}</h3>
						</div>
						{activityCompleted ? (
							<FaCheckCircle className="text-green-500" />
						) : (
							<FaLock className="text-gray-400" />
						)}
					</div>
					<p className="mt-2 text-sm text-gray-600">{activity.description}</p>
					{isVideoCompleted && (
						<div className="flex justify-center">
							<FaArrowDown className="my-4 mb-1 animate-bounce-up-down text-green-500" />{' '}
						</div>
					)}
					<div className="space-y-2">
						<Button
							onClick={
								activityCompleted
									? handleCompletedActivityClick
									: handleOpenActivity
							}
							disabled={!isVideoCompleted}
							className={`group relative w-full overflow-hidden ${
								activityCompleted
									? 'bg-green-500 text-white hover:bg-green-700 active:scale-95'
									: isVideoCompleted
										? 'font-semibold text-black'
										: 'bg-gray-400 text-background'
							}`}
						>
							{/* Fondo animado solo para el estado activo no completado */}
							{isVideoCompleted && !activityCompleted && (
								<div className="absolute inset-0 z-0 animate-pulse bg-gradient-to-r from-[#3AF4EF] to-[#2ecc71] opacity-80 group-hover:from-green-700 group-hover:to-green-700" />
							)}

							{/* Texto siempre por encima del gradiente */}
							<span className="relative z-10 flex items-center justify-center">
								{activityCompleted ? (
									<>
										{isLoadingResults && (
											<Icons.spinner className="absolute -left-5 h-4 w-4 animate-spin" />
										)}
										<span className="">Ver Resultados</span>
										<FaCheckCircle className="ml-2 inline text-white" />
									</>
								) : (
									<>
										{isLoadingActivity && (
											<Icons.spinner className="absolute -left-5 h-4 w-4 animate-spin" />
										)}
										<span>Ver Actividad</span>
									</>
								)}
							</span>
						</Button>

						{activityCompleted && nextLessonId && (
							<div className="mt-4 flex flex-col items-center space-y-2">
								<div className="h-px w-full bg-gray-200" />
								<Link
									href={`/estudiantes/clases/${nextLessonId}`}
									className="group flex flex-col items-center text-center"
								>
									<PiArrowFatLinesLeft className="h-8 w-8 -rotate-90 text-background transition-transform group-hover:-translate-y-1" />
									<span className="mt-1 text-sm text-gray-600 group-hover:text-blue-500 hover:underline">
										Ir a la siguiente clase
									</span>
								</Link>
							</div>
						)}
					</div>
				</div>
			) : (
				<p className="text-gray-600">No hay actividades disponibles</p>
			)}
			{activity && (
				<LessonActivityModal
					isOpen={isModalOpen}
					onClose={() => {
						closeModal();
						setSavedResults(null);
					}}
					activity={activity}
					onQuestionsAnswered={handleQuestionsAnswered}
					userId={userId}
					markActivityAsCompleted={markActivityAsCompleted}
					onActivityCompleted={handleActivityCompletion}
					savedResults={savedResults}
					onLessonUnlocked={onLessonUnlocked}
					isLastLesson={isLastLesson}
				/>
			)}
			{renderGradeSummary()}
		</div>
	);
};

export default LessonActivities;
