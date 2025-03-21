import { useState, useEffect } from 'react';

import Link from 'next/link';

import { FaCheckCircle, FaLock } from 'react-icons/fa';
import { MdKeyboardDoubleArrowDown } from 'react-icons/md';
import { TbReportAnalytics } from 'react-icons/tb';
import { toast } from 'sonner';
import useSWR from 'swr';

import { Icons } from '~/components/estudiantes/ui/icons';

import LessonActivityModal from './LessonActivityModal';
import { GradeHistory } from './LessonGradeHistory';
import { LessonGrades } from './LessonGrades';

import type { Activity, SavedAnswer } from '~/types';

import '~/styles/arrowclass.css';

interface LessonActivitiesProps {
	activity: Activity | null;
	isVideoCompleted: boolean;
	isActivityCompleted: boolean;
	handleActivityCompletion: () => Promise<void>;
	userId: string;
	nextLessonId?: number;
	onLessonUnlocked: (lessonId: number) => void;
	courseId: number;
	isLastLesson: boolean; // Add this prop
	isLastActivity: boolean; // Add this prop
	resourceNames: string[]; // Add this prop
}

interface SavedResults {
	score: number;
	answers: Record<string, SavedAnswer>;
	isAlreadyCompleted?: boolean;
}

interface CourseGradeSummary {
	finalGrade: number;
	courseCompleted?: boolean;
	parameters: {
		name: string;
		grade: number;
		weight: number;
		activities: {
			id: number;
			name: string;
			grade: number;
		}[];
	}[];
}

// Add type for API response
interface GradeSummaryResponse {
	finalGrade: number;
	courseCompleted?: boolean;
	isCompleted: boolean;
	parameters: {
		name: string;
		grade: number;
		weight: number;
		activities: {
			id: number;
			name: string;
			grade: number;
		}[];
	}[];
}

// Add validation function
const isValidGradeSummaryResponse = (
	data: unknown
): data is GradeSummaryResponse => {
	if (!data || typeof data !== 'object') return false;

	const response = data as Partial<GradeSummaryResponse>;

	return (
		typeof response.finalGrade === 'number' &&
		Array.isArray(response.parameters) &&
		response.parameters.every(
			(param) =>
				typeof param.name === 'string' &&
				typeof param.grade === 'number' &&
				typeof param.weight === 'number' &&
				Array.isArray(param.activities) &&
				param.activities.every(
					(act) =>
						typeof act.id === 'number' &&
						typeof act.name === 'string' &&
						typeof act.grade === 'number'
				)
		)
	);
};

const fetchGradeData = async (url: string): Promise<GradeSummaryResponse> => {
	const response = await fetch(url);
	if (!response.ok) throw new Error('Failed to fetch grades');

	const rawData: unknown = await response.json();

	if (!isValidGradeSummaryResponse(rawData)) {
		throw new Error('Invalid grade summary response format');
	}

	return rawData;
};

// Add interface for GET /api/activities/getAnswers response
interface ActivityAnswersResponse {
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
	courseId,
	isLastLesson,
	isLastActivity,
	resourceNames: _resourceNames, // Rename to indicate it's not used here
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

	// Add new state for grade history modal
	const [isGradeHistoryOpen, setIsGradeHistoryOpen] = useState(false);

	// Add new state for button loading
	const [isButtonLoading, setIsButtonLoading] = useState(true);

	// Add loading state for grades
	const [isGradesLoading, setIsGradesLoading] = useState(true);

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

	// Modify fetchGradeSummary to use SWR correctly with proper types
	const { data: gradeData } = useSWR<GradeSummaryResponse>(
		courseId && userId
			? `/api/grades/summary?courseId=${courseId}&userId=${userId}`
			: null,
		fetchGradeData,
		{
			refreshInterval: 5000,
			revalidateOnFocus: false,
		}
	);

	// Update gradeSummary when data changes
	useEffect(() => {
		if (gradeData) {
			setGradeSummary({
				finalGrade: gradeData.finalGrade,
				courseCompleted: gradeData.isCompleted,
				parameters: gradeData.parameters,
			});
			setIsGradesLoading(false);
		}
	}, [gradeData]);

	// Add type guard
	const isActivityAnswersResponse = (
		data: unknown
	): data is ActivityAnswersResponse => {
		if (!data || typeof data !== 'object') return false;
		const response = data as Partial<ActivityAnswersResponse>;
		return (
			typeof response.score === 'number' &&
			typeof response.answers === 'object' &&
			response.answers !== null &&
			typeof response.isAlreadyCompleted === 'boolean'
		);
	};

	// Add useEffect to check activity completion on mount
	useEffect(() => {
		const checkActivityStatus = async () => {
			if (!activity?.id) {
				setIsButtonLoading(false);
				return;
			}

			setIsButtonLoading(true);
			try {
				const response = await fetch(
					`/api/activities/getAnswers?activityId=${activity.id}&userId=${userId}`
				);

				if (response.ok) {
					const rawData: unknown = await response.json();

					// Set activity as completed if there are any answers, regardless of score
					if (
						isActivityAnswersResponse(rawData) &&
						rawData.answers &&
						Object.keys(rawData.answers).length > 0
					) {
						setActivityCompleted(true);
						setSavedResults({
							score: rawData.score,
							answers: rawData.answers,
							isAlreadyCompleted: true,
						});
					}
				}
			} catch (error) {
				console.error('Error checking activity status:', error);
			} finally {
				setIsButtonLoading(false);
			}
		};

		void checkActivityStatus();
	}, [activity?.id, userId]);

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
				const rawData: unknown = await response.json();

				if (isActivityAnswersResponse(rawData)) {
					setSavedResults({
						score: rawData.score,
						answers: rawData.answers,
						isAlreadyCompleted: true,
					});
					// For last activity, always set as completed
					if (isLastActivity) {
						setActivityCompleted(true);
					}
				}
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

	const handleActivityComplete = () => {
		setActivityCompleted(true); // Solo actualiza el estado del botón
	};

	return (
		<div className="w-72 p-4">
			<h2 className="mb-4 text-2xl font-bold text-primary">Actividades</h2>
			{/* Activity section */}
			{activity ? (
				<div className="rounded-lg border bg-gray-50 p-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-semibold text-gray-900">{activity.name}</h3>
						</div>
						{!isButtonLoading &&
							(activityCompleted ? (
								<FaCheckCircle className="text-green-500" />
							) : (
								<FaLock className="text-gray-400" />
							))}
					</div>
					<p className="mt-2 text-sm text-gray-600">{activity.description}</p>
					{isVideoCompleted && (
						<div className="flex justify-center">
							{!isButtonLoading &&
								(activityCompleted ? (
									<TbReportAnalytics className="mb-2 size-12 text-2xl text-background" />
								) : (
									<MdKeyboardDoubleArrowDown className="size-10 animate-bounce-up-down text-2xl text-green-500" />
								))}
						</div>
					)}
					<div className="space-y-2">
						<button
							onClick={
								activityCompleted
									? handleCompletedActivityClick
									: handleOpenActivity
							}
							disabled={!isVideoCompleted || isButtonLoading}
							className={`group relative w-full overflow-hidden rounded-md px-4 py-2 transition-all duration-300 ${
								activityCompleted || (isLastActivity && savedResults)
									? 'bg-green-500 text-white hover:bg-green-700 active:scale-95'
									: isVideoCompleted
										? 'font-semibold text-black'
										: 'bg-gray-400 text-background'
							} [&:disabled]:bg-opacity-50 disabled:pointer-events-none [&:disabled_span]:opacity-100 [&:disabled_svg]:opacity-100`}
						>
							{/* Fondo animado solo cuando está habilitado */}
							{isVideoCompleted && !activityCompleted && (
								<div className="absolute inset-0 z-0 animate-pulse bg-gradient-to-r from-[#3AF4EF] to-[#2ecc71] opacity-80 group-hover:from-green-700 group-hover:to-green-700" />
							)}

							{/* Contenido que siempre mantiene su opacidad */}
							<span className="relative z-10 flex items-center justify-center">
								{isButtonLoading ? (
									<div className="flex items-center gap-2">
										<Icons.spinner className="h-4 w-4 animate-spin text-background" />
										<span className="font-semibold text-background">
											Cargando...
										</span>
									</div>
								) : activityCompleted || (isLastActivity && savedResults) ? (
									<>
										{isLoadingResults && (
											<Icons.spinner className="absolute -left-5 h-4 w-4 animate-spin" />
										)}
										<span className='font-semibold'>Ver Resultados</span>
										<FaCheckCircle className="ml-2 inline text-white" />
									</>
								) : (
									<>
										{isLoadingActivity && (
											<Icons.spinner className="absolute -left-5 h-4 w-4 animate-spin active:scale-[0.98]" />
										)}
										<span>Ver Actividad</span>
									</>
								)}
							</span>
						</button>

						{activityCompleted && nextLessonId && (
							<div className="mt-4 flex flex-col items-center space-y-2">
								<div className="w-50 border border-b-gray-500" />
								<Link
									href={`/estudiantes/clases/${nextLessonId}`}
									className="next-lesson-link group flex flex-col items-center text-center"
								>
									<button className="arrow-button">
										<div className="arrow-button-box">
											<span className="arrow-button-elem">
												<svg
													viewBox="0 0 46 40"
													xmlns="http://www.w3.org/2000/svg"
												>
													<path d="M46 20.038c0-.7-.3-1.5-.8-2.1l-16-17c-1.1-1-3.2-1.4-4.4-.3-1.2 1.1-1.2 3.3 0 4.4l11.3 11.9H3c-1.7 0-3 1.3-3 3s1.3 3 3 3h33.1l-11.3 11.9c-1 1-1.2 3.3 0 4.4 1.2 1.1 3.3.8 4.4-.3l16-17c.5-.5.8-1.1.8-1.9z" />
												</svg>
											</span>
											<span className="arrow-button-elem">
												<svg viewBox="0 0 46 40">
													<path d="M46 20.038c0-.7-.3-1.5-.8-2.1l-16-17c-1.1-1-3.2-1.4-4.4-.3-1.2 1.1-1.2 3.3 0 4.4l11.3 11.9H3c-1.7 0-3 1.3-3 3s1.3 3 3 3h33.1l-11.3 11.9c-1 1-1.2 3.3 0 4.4 1.2 1.1 3.3.8 4.4-.3l16-17c.5-.5.8-1.1.8-1.9z" />
												</svg>
											</span>
										</div>
									</button>
									<em className="mt-1 text-sm font-bold text-gray-600 group-hover:text-blue-500 hover:underline">
										Ir a la siguiente clase
									</em>
								</Link>
							</div>
						)}
					</div>
				</div>
			) : (
				<p className="text-gray-600">No hay actividades disponibles</p>
			)}

			{/* Grades Section with Title */}
			<div className="mt-4">
				<h2 className="mb-4 text-2xl font-bold text-primary">Calificaciones</h2>
				<LessonGrades
					finalGrade={gradeSummary?.finalGrade ?? null}
					onViewHistory={() => setIsGradeHistoryOpen(true)}
					isLoading={isGradesLoading}
				/>
			</div>

			{/* Modal */}
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
					isLastActivity={isLastActivity}
					courseId={courseId}
					onViewHistory={() => setIsGradeHistoryOpen(true)} // Add this prop
					onActivityComplete={handleActivityComplete} // Add this prop
				/>
			)}

			{/* Grade History Modal */}
			<GradeHistory
				isOpen={isGradeHistoryOpen}
				onClose={() => setIsGradeHistoryOpen(false)}
				gradeSummary={gradeSummary}
			/>
		</div>
	);
};

export default LessonActivities;
