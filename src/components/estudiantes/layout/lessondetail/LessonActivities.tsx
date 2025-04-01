import { useState, useEffect, useCallback } from 'react';

import Link from 'next/link';

import { FaCheckCircle, FaLock } from 'react-icons/fa';
import { MdKeyboardDoubleArrowDown } from 'react-icons/md';
import { TbReportAnalytics, TbClockFilled } from 'react-icons/tb';
import { toast } from 'sonner';
import useSWR from 'swr';

import { Icons } from '~/components/estudiantes/ui/icons';

import LessonActivityModal from './LessonActivityModal';
import { GradeHistory } from './LessonGradeHistory';
import { LessonGrades } from './LessonGrades';

import type { Activity, SavedAnswer } from '~/types';

import '~/styles/arrowclass.css';

interface LessonActivitiesProps {
	activities: Activity[];
	isVideoCompleted: boolean;
	isActivityCompleted: boolean;
	handleActivityCompletion: () => Promise<void>;
	userId: string;
	onLessonUnlocked: (lessonId: number) => void;
	courseId: number;
	isLastLesson: boolean;
	isLastActivity: boolean;
	resourceNames: string[];
	getNextLessonId: () => number | undefined; // Add this prop
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

interface ActivityAnswersResponse {
	score: number;
	answers: Record<string, SavedAnswer>;
	isAlreadyCompleted: boolean;
}

const LessonActivities = ({
	activities = [],
	isVideoCompleted,
	isActivityCompleted: _isActivityCompleted,
	handleActivityCompletion,
	userId,
	onLessonUnlocked,
	courseId,
	isLastLesson,
	isLastActivity,
	resourceNames: _resourceNames,
	getNextLessonId, // Add this prop
}: LessonActivitiesProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const [savedResults, setSavedResults] = useState<SavedResults | null>(null);
	const [loadingResults, setLoadingResults] = useState<Record<number, boolean>>(
		{}
	);
	const [gradeSummary, setGradeSummary] = useState<CourseGradeSummary | null>(
		null
	);

	const [isLoadingActivity, setIsLoadingActivity] = useState(false);
	const [isGradeHistoryOpen, setIsGradeHistoryOpen] = useState(false);
	const [isButtonLoading, setIsButtonLoading] = useState(true);
	const [isGradesLoading, setIsGradesLoading] = useState(true);
	const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
		null
	);

	const [completedActivities, setCompletedActivities] = useState<
		Record<number, boolean>
	>({});

	const openModal = () => setIsModalOpen(true);
	const closeModal = () => setIsModalOpen(false);

	const handleQuestionsAnswered = () => {
		if (selectedActivity) {
			const currentIndex = activities.indexOf(selectedActivity);
			const nextActivity = activities[currentIndex + 1];

			setCompletedActivities((prev) => ({
				...prev,
				[selectedActivity.id]: true,
				...(nextActivity && { [nextActivity.id]: false }),
			}));
		}
	};

	const markActivityAsCompleted = async (): Promise<void> => {
		if (selectedActivity) {
			setCompletedActivities((prev) => ({
				...prev,
				[selectedActivity.id]: true,
			}));
		}
		return Promise.resolve();
	};

	const { data: grades } = useSWR<GradeSummaryResponse>(
		courseId && userId
			? `/api/grades/summary?courseId=${courseId}&userId=${userId}`
			: null,
		fetchGradeData,
		{
			refreshInterval: 5000,
			revalidateOnFocus: false,
		}
	);

	useEffect(() => {
		if (grades) {
			setGradeSummary({
				finalGrade: grades.finalGrade,
				courseCompleted: grades.isCompleted,
				parameters: grades.parameters,
			});
			setIsGradesLoading(false);
		}
	}, [grades]);

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

	useEffect(() => {
		const checkActivitiesStatus = async () => {
			if (!activities.length) {
				setIsButtonLoading(false);
				return;
			}

			setIsButtonLoading(true);
			try {
				const statuses: Record<number, boolean> = {};

				await Promise.all(
					activities.slice(0, 3).map(async (activity) => {
						const response = await fetch(
							`/api/activities/getAnswers?activityId=${activity.id}&userId=${userId}`
						);

						if (response.ok) {
							const rawData: unknown = await response.json();
							if (
								isActivityAnswersResponse(rawData) &&
								rawData.answers &&
								Object.keys(rawData.answers).length > 0 &&
								rawData.isAlreadyCompleted
							) {
								statuses[activity.id] = true;
							} else {
								statuses[activity.id] = false;
							}
						}
					})
				);

				setCompletedActivities(statuses);
			} catch (error) {
				console.error('Error checking activities status:', error);
			} finally {
				setIsButtonLoading(false);
			}
		};

		void checkActivitiesStatus();
	}, [activities, userId]);

	const handleCompletedActivityClick = async (activity: Activity) => {
		try {
			setLoadingResults((prev) => ({ ...prev, [activity.id]: true }));
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

					setSelectedActivity(activity);
					if (isLastActivity) {
						setCompletedActivities((prev) => ({
							...prev,
							[activityId]: true,
						}));
					}
				}
			}
			openModal();
		} catch (e) {
			console.error('Error fetching results:', e);
			toast.error('Error al cargar los resultados');
		} finally {
			setLoadingResults((prev) => ({ ...prev, [activity.id]: false }));
		}
	};

	const handleOpenActivity = (activity: Activity) => {
		setSelectedActivity(activity);
		setIsLoadingActivity(true);
		try {
			openModal();
		} finally {
			setIsLoadingActivity(false);
		}
	};

	const isLastActivityInLesson = (currentActivity: Activity) => {
		if (!activities.length) return false;
		const activityIndex = activities.indexOf(currentActivity);
		return activityIndex === activities.length - 1;
	};

	const handleModalClose = () => {
		closeModal();

		if (selectedActivity) {
			setCompletedActivities((prev) => {
				const currentIndex = activities.indexOf(selectedActivity);
				const nextActivity = activities[currentIndex + 1];

				const updatedActivities: Record<number, boolean> = {
					...prev,
					[selectedActivity.id]: true,
				};

				if (nextActivity) {
					updatedActivities[nextActivity.id] = false;
				}

				return updatedActivities;
			});

			void fetch(
				`/api/activities/getAnswers?activityId=${selectedActivity.id}&userId=${userId}`
			)
				.then(async (response) => {
					if (response.ok) {
						const data = (await response.json()) as ActivityAnswersResponse;
						if (isActivityAnswersResponse(data)) {
							setSavedResults({
								score: data.score,
								answers: data.answers,
								isAlreadyCompleted: true,
							});
						}
					}
				})
				.catch((error) => {
					console.error('Error updating activity status:', error);
				});
		}

		setSavedResults(null);
		setSelectedActivity(null);
	};

	const getButtonClasses = (activity: Activity, isLastActivity: boolean) => {
		if (isButtonLoading) {
			return 'bg-gray-300 text-gray-300 border-none'; // Estilo consistente para todos los botones en carga
		}

		return completedActivities[activity.id] || (isLastActivity && savedResults)
			? 'bg-green-500 text-white hover:bg-green-700 active:scale-95'
			: isVideoCompleted
				? 'font-semibold text-black'
				: 'bg-gray-400 text-background';
	};

	const getButtonLabel = (activity: Activity) => {
		if (isButtonLoading) {
			return (
				<div className="flex items-center gap-2">
					<Icons.spinner className="h-4 w-4 animate-spin text-gray-800" />
					<span className="font-semibold text-gray-800">Cargando...</span>
				</div>
			);
		}

		if (completedActivities[activity.id]) {
			return (
				<>
					{loadingResults[activity.id] && (
						<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
					)}
					<span className="font-semibold">Ver Resultados</span>
					<FaCheckCircle className="ml-2 inline text-white" />
				</>
			);
		}

		return (
			<>
				{isLoadingActivity && activity.id === selectedActivity?.id && (
					<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
				)}
				<span>Ver Actividad</span>
			</>
		);
	};

	const isLastCompletedActivity = useCallback(
		(activity: Activity) => {
			const activityIndex = activities.indexOf(activity);
			return (
				activityIndex === Math.min(activities.length - 1, 2) &&
				completedActivities[activity.id]
			);
		},
		[activities, completedActivities]
	);

	useEffect(() => {
		activities.forEach((activity) => {
			if (isLastCompletedActivity(activity)) {
				console.debug('Last completed activity:', activity.id);
			}
		});
	}, [activities, isLastCompletedActivity]);

	const getActivityStatus = (activity: Activity, index: number) => {
		if (isButtonLoading) {
			return {
				icon: <TbClockFilled className="text-gray-400" />,
				bgColor: 'bg-gray-200',
				isActive: false,
			};
		}

		if (completedActivities[activity.id]) {
			return {
				icon: <FaCheckCircle className="text-green-500" />,
				bgColor: 'bg-green-100',
				isActive: true,
			};
		}

		if (!isVideoCompleted) {
			return {
				icon: <FaLock className="text-gray-400" />,
				bgColor: 'bg-gray-200',
				isActive: false,
			};
		}

		// First activity is always active when video is completed
		if (index === 0) {
			return {
				icon: <TbClockFilled className="text-blue-500" />,
				bgColor: 'bg-blue-100',
				isActive: true,
			};
		}

		// Previous activity must be completed to unlock current one
		const previousActivity = activities[index - 1];
		const isPreviousCompleted =
			previousActivity && completedActivities[previousActivity.id];

		return {
			icon: isPreviousCompleted ? (
				<TbClockFilled className="text-blue-500" />
			) : (
				<FaLock className="text-gray-400" />
			),
			bgColor: isPreviousCompleted ? 'bg-blue-100' : 'bg-gray-200',
			isActive: isPreviousCompleted ?? false,
		};
	};

	const shouldShowArrows = (activity: Activity, index: number) => {
		if (!isVideoCompleted) return false;
		if (completedActivities[activity.id]) return false;

		// Show arrows if this activity is unlocked but not completed
		const previousActivity = activities[index - 1];
		const isPreviousCompleted = previousActivity
			? completedActivities[previousActivity.id]
			: true; // First activity is considered to have "completed previous"

		return isPreviousCompleted;
	};

	const renderActivityCard = (activity: Activity, index: number) => {
		const status = getActivityStatus(activity, index);
		const isFirstActivity = index === 0;
		const canAccess = isFirstActivity || completedActivities[activities[0]?.id];
		const isNextLessonAvailable =
			!isLastLesson && isLastActivityInLesson(activity);

		return (
			<div key={activity.id}>
				<div
					className={`mb-4 rounded-lg border p-4 ${
						isButtonLoading
							? 'bg-white' // Tarjeta blanca durante carga
							: status.isActive
								? 'bg-white'
								: 'bg-gray-100 opacity-60'
					}`}
				>
					<div className="flex items-center justify-between">
						<div className="flex-1">
							<h3 className="font-semibold text-gray-900">{activity.name}</h3>
						</div>
						<div className="ml-2">
							<div className={`rounded-full p-1 ${status.bgColor}`}>
								{status.icon}
							</div>
						</div>
					</div>

					<p className="mt-2 text-sm text-gray-600">{activity.description}</p>

					<div className="space-y-2">
						{/* Mostrar flechas solo cuando la actividad está desbloqueada y no completada */}
						{shouldShowArrows(activity, index) && !isButtonLoading && (
							<div className="flex justify-center py-2">
								<MdKeyboardDoubleArrowDown className="size-10 animate-bounce-up-down text-2xl text-green-500" />
							</div>
						)}

						{/* Mostrar icono de reporte solo cuando la actividad está completada y no está cargando */}
						{completedActivities[activity.id] && !isButtonLoading && (
							<div className="flex justify-center">
								<TbReportAnalytics className="mb-2 size-12 text-2xl text-gray-700" />
							</div>
						)}

						<button
							onClick={
								completedActivities[activity.id]
									? () => handleCompletedActivityClick(activity)
									: () => handleOpenActivity(activity)
							}
							disabled={!isVideoCompleted || isButtonLoading || !canAccess}
							className={`group relative w-full overflow-hidden rounded-md px-4 py-2 transition-all duration-300 ${getButtonClasses(activity, isLastActivity)} ${!canAccess && !isButtonLoading ? 'cursor-not-allowed bg-gray-200' : ''} [&:disabled]:bg-opacity-100 disabled:pointer-events-none [&:disabled_span]:opacity-100 [&:disabled_svg]:opacity-100`}
						>
							{/* Animated gradient background */}
							{isVideoCompleted &&
								!completedActivities[activity.id] &&
								canAccess &&
								!isButtonLoading && (
									<div className="absolute inset-0 z-0 animate-pulse bg-gradient-to-r from-[#3AF4EF] to-[#2ecc71] opacity-80 group-hover:from-green-700 group-hover:to-green-700" />
								)}

							<span className="relative z-10 flex items-center justify-center">
								{getButtonLabel(activity)}
							</span>
						</button>

						{/* Agregar el botón de siguiente clase cuando la actividad está completada y no es la última lección */}
						{completedActivities[activity.id] && isNextLessonAvailable && (
							<div className="mt-4 flex flex-col items-center space-y-2">
								<div className="w-50 border border-b-gray-500" />
								<Link
									href={`/estudiantes/clases/${getNextLessonId()}`}
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
			</div>
		);
	};

	return (
		<div className="w-72 p-4">
			<h2 className="mb-4 text-2xl font-bold text-primary">Actividades</h2>
			{activities.length > 0 ? (
				<div className="max-h-[calc(100vh-200px)] space-y-4 overflow-y-auto">
					{activities
						.slice(0, 3)
						.map((activity, index) => renderActivityCard(activity, index))}
				</div>
			) : (
				<p className="text-gray-600">No hay actividades disponibles</p>
			)}
			<div className="mt-4">
				<h2 className="mb-4 text-2xl font-bold text-primary">Calificaciones</h2>
				<LessonGrades
					finalGrade={gradeSummary?.finalGrade ?? null}
					onViewHistoryAction={() => setIsGradeHistoryOpen(true)}
					isLoading={isGradesLoading}
				/>
			</div>
			{selectedActivity && (
				<LessonActivityModal
					isOpen={isModalOpen}
					onClose={handleModalClose}
					activity={selectedActivity}
					onQuestionsAnswered={handleQuestionsAnswered}
					userId={userId}
					markActivityAsCompleted={markActivityAsCompleted}
					onActivityCompleted={handleActivityCompletion}
					savedResults={savedResults}
					onLessonUnlocked={onLessonUnlocked}
					isLastLesson={isLastLesson}
					isLastActivity={isLastActivity}
					courseId={courseId}
					onViewHistory={() => setIsGradeHistoryOpen(true)}
					onActivityComplete={handleActivityCompletion}
					isLastActivityInLesson={isLastActivityInLesson(selectedActivity)}
				/>
			)}
			<GradeHistory
				isOpen={isGradeHistoryOpen}
				onClose={() => setIsGradeHistoryOpen(false)}
				gradeSummary={gradeSummary}
			/>
		</div>
	);
};

export default LessonActivities;
