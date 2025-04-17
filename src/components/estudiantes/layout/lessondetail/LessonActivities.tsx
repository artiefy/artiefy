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
import LessonResource from './LessonResource';

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
	lessonId: number;
	isLastLesson: boolean;
	isLastActivity: boolean;
	lessons: { id: number; title: string }[];
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

interface ActivityState {
	savedResults: SavedResults | null;
	isLoading: boolean;
	isCompleted: boolean;
}

// Add helper function to extract and sort lesson numbers
const extractLessonNumber = (title: string): number => {
	if (title.toLowerCase().includes('bienvenida')) return -1;
	const match = /\d+/.exec(title);
	return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
};

const LessonActivities = ({
	activities = [],
	isVideoCompleted,
	isActivityCompleted: _isActivityCompleted,
	handleActivityCompletion,
	userId,
	onLessonUnlocked,
	courseId,
	lessonId,
	isLastLesson,
	isLastActivity,
	lessons,
}: LessonActivitiesProps) => {
	const [activitiesState, setActivitiesState] = useState<
		Record<number, ActivityState>
	>({});
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
		null
	);
	const [isGradeHistoryOpen, setIsGradeHistoryOpen] = useState(false);
	const [isButtonLoading, setIsButtonLoading] = useState(true);
	const [isGradesLoading, setIsGradesLoading] = useState(true);
	const [gradeSummary, setGradeSummary] = useState<CourseGradeSummary | null>(
		null
	);

	const openModal = () => setIsModalOpen(true);
	const closeModal = () => setIsModalOpen(false);

	const handleQuestionsAnswered = () => {
		if (selectedActivity) {
			const currentIndex = activities.indexOf(selectedActivity);
			const nextActivity = activities[currentIndex + 1];

			setActivitiesState((prev) => ({
				...prev,
				[selectedActivity.id]: {
					...prev[selectedActivity.id],
					isCompleted: true,
				},
				...(nextActivity && {
					[nextActivity.id]: { ...prev[nextActivity.id], isCompleted: false },
				}),
			}));
		}
	};

	const markActivityAsCompleted = async (): Promise<void> => {
		if (selectedActivity) {
			setActivitiesState((prev) => ({
				...prev,
				[selectedActivity.id]: {
					...prev[selectedActivity.id],
					isCompleted: true,
				},
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
				const activityPromises = activities
					.slice(0, 3)
					.map(async (activity) => {
						const response = await fetch(
							`/api/activities/getAnswers?activityId=${activity.id}&userId=${userId}`
						);

						if (!response.ok) {
							return null;
						}

						const rawData: unknown = await response.json();
						if (isActivityAnswersResponse(rawData)) {
							return {
								activityId: activity.id,
								state: {
									savedResults: {
										score: rawData.score,
										answers: rawData.answers,
										isAlreadyCompleted: rawData.isAlreadyCompleted,
									},
									isLoading: false,
									isCompleted: rawData.isAlreadyCompleted,
								},
							};
						}
						return null;
					});

				const results = await Promise.all(activityPromises);
				const newActivitiesState: Record<number, ActivityState> = {};

				results.forEach((result) => {
					if (result) {
						newActivitiesState[result.activityId] = result.state;
					}
				});

				// Update state only once with all results
				setActivitiesState((prev) => ({
					...prev,
					...newActivitiesState,
				}));
			} catch (error) {
				console.error('Error checking activities status:', error);
			} finally {
				setIsButtonLoading(false);
			}
		};

		void checkActivitiesStatus();
	}, [activities, userId]); // Only depend on activities and userId

	const handleCompletedActivityClick = async (activity: Activity) => {
		try {
			setActivitiesState((prev) => ({
				...prev,
				[activity.id]: { ...prev[activity.id], isLoading: true },
			}));

			const response = await fetch(
				`/api/activities/getAnswers?activityId=${activity.id}&userId=${userId}`
			);

			if (response.ok) {
				const rawData: unknown = await response.json();
				if (isActivityAnswersResponse(rawData)) {
					setActivitiesState((prev) => ({
						...prev,
						[activity.id]: {
							savedResults: {
								score: rawData.score,
								answers: rawData.answers,
								isAlreadyCompleted: true,
							},
							isLoading: false,
							isCompleted: true,
						},
					}));
				}
			}
			setSelectedActivity(activity);
			openModal();
		} catch (e) {
			console.error('Error fetching results:', e);
			toast.error('Error al cargar los resultados');
		}
	};

	const handleOpenActivity = (activity: Activity) => {
		setSelectedActivity(activity);
		setActivitiesState((prev) => ({
			...prev,
			[activity.id]: {
				...prev[activity.id],
				savedResults: null,
				isLoading: false,
			},
		}));

		openModal();
	};

	const isLastActivityInLesson = (currentActivity: Activity) => {
		if (!activities.length) return false;
		const activityIndex = activities.indexOf(currentActivity);
		return activityIndex === activities.length - 1;
	};

	const handleModalClose = () => {
		if (!selectedActivity) {
			closeModal();
			return;
		}

		const currentActivity = selectedActivity;
		closeModal();

		// Remove the state updates that were affecting other activities
		setActivitiesState((prev) => {
			const updatedState = { ...prev };

			// Only update the current activity's state
			updatedState[currentActivity.id] = {
				...(prev[currentActivity.id] || {}),
				isCompleted: true,
			};

			return updatedState;
		});

		// Keep the fetch call to update current activity's results
		void fetch(
			`/api/activities/getAnswers?activityId=${currentActivity.id}&userId=${userId}`
		)
			.then(async (response) => {
				if (response.ok) {
					const rawData: unknown = await response.json();
					if (isActivityAnswersResponse(rawData)) {
						setActivitiesState((prev) => ({
							...prev,
							[currentActivity.id]: {
								savedResults: {
									score: rawData.score,
									answers: rawData.answers,
									isAlreadyCompleted: rawData.isAlreadyCompleted,
								},
								isLoading: false,
								isCompleted: true,
							},
						}));
					}
				}
			})
			.catch((error) => {
				console.error('Error updating activity status:', error);
			});

		setSelectedActivity(null);
	};

	const getButtonClasses = (activity: Activity) => {
		const activityState = activitiesState[activity.id];

		if (isButtonLoading) {
			return 'bg-gray-300 text-gray-300 border-none'; // Estilo consistente para todos los botones en carga
		}

		return activityState?.isCompleted
			? 'bg-green-500 text-white hover:bg-green-700 active:scale-95'
			: isVideoCompleted
				? 'font-semibold text-black'
				: 'bg-gray-400 text-background';
	};

	const getButtonLabel = (activity: Activity) => {
		const activityState = activitiesState[activity.id];

		if (isButtonLoading) {
			return (
				<div className="flex items-center gap-2">
					<Icons.spinner className="h-4 w-4 animate-spin text-gray-800" />
					<span className="font-semibold text-gray-800">Cargando...</span>
				</div>
			);
		}

		if (activityState?.isCompleted) {
			return (
				<>
					{activityState.isLoading && (
						<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
					)}
					<span className="font-semibold">
						{activity.typeid === 1 ? 'Ver Documento' : 'Ver Resultados'}
					</span>
					<FaCheckCircle className="ml-2 inline text-white" />
				</>
			);
		}

		return (
			<>
				{activityState?.isLoading && (
					<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
				)}
				<span>{activity.typeid === 1 ? 'Ver Actividad' : 'Ver Actividad'}</span>
			</>
		);
	};

	const getActivityStatus = (activity: Activity, index: number) => {
		const activityState = activitiesState[activity.id];

		if (isButtonLoading) {
			return {
				icon: <TbClockFilled className="text-gray-400" />,
				bgColor: 'bg-gray-200',
				isActive: false,
			};
		}

		if (activityState?.isCompleted) {
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
			previousActivity && activitiesState[previousActivity.id]?.isCompleted;

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
		if (activitiesState[activity.id]?.isCompleted) return false;

		// Show arrows if this activity is unlocked but not completed
		const previousActivity = activities[index - 1];
		const isPreviousCompleted = previousActivity
			? activitiesState[previousActivity.id]?.isCompleted
			: true; // First activity is considered to have "completed previous"

		return isPreviousCompleted;
	};

	const truncateDescription = (description: string | null, maxLength = 60) => {
		if (!description) return '';
		if (description.length <= maxLength) return description;
		return description.slice(0, maxLength).trim() + '...';
	};

	const getNextAvailableLessonId = useCallback(() => {
		if (!lessons || lessons.length === 0) return undefined;

		// Sort lessons by their number
		const sortedLessons = [...lessons].sort((a, b) => {
			const aNum = extractLessonNumber(a.title);
			const bNum = extractLessonNumber(b.title);
			return aNum - bNum;
		});

		// Find current lesson index
		const currentIndex = sortedLessons.findIndex((l) => l.id === lessonId);
		if (currentIndex === -1 || currentIndex === sortedLessons.length - 1) {
			return undefined;
		}

		// Get next lesson
		const nextLesson = sortedLessons[currentIndex + 1];
		return nextLesson?.id;
	}, [lessons, lessonId]);

	const renderActivityCard = (activity: Activity, index: number) => {
		const activityState = activitiesState[activity.id];
		const status = getActivityStatus(activity, index);
		const isFirstActivity = index === 0;
		const previousActivity = index > 0 ? activities[index - 1] : null;
		const isPreviousCompleted =
			!previousActivity || activitiesState[previousActivity.id]?.isCompleted;
		const canAccess = isFirstActivity || isPreviousCompleted;
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

					<p className="mt-2 line-clamp-2 text-sm text-gray-600">
						{truncateDescription(activity.description)}
					</p>

					<div className="space-y-2">
						{/* Solo mostrar flechas y botón de siguiente clase cuando no está cargando */}
						{!isButtonLoading && (
							<>
								{shouldShowArrows(activity, index) && (
									<div className="flex justify-center pt-4">
										<MdKeyboardDoubleArrowDown className="animate-bounce-up-down size-10 text-2xl text-green-500" />
									</div>
								)}

								{activityState?.isCompleted && (
									<div className="flex justify-center">
										<TbReportAnalytics className="mt-3 size-12 text-2xl text-gray-700" />
									</div>
								)}
							</>
						)}

						<button
							onClick={
								activityState?.isCompleted
									? () => handleCompletedActivityClick(activity)
									: () => handleOpenActivity(activity)
							}
							disabled={!isVideoCompleted || isButtonLoading || !canAccess}
							className={`group relative w-full overflow-hidden rounded-md px-4 py-2 transition-all duration-300 ${getButtonClasses(activity)} ${!canAccess && !isButtonLoading ? 'cursor-not-allowed bg-gray-200' : ''} [&:disabled]:bg-opacity-100 disabled:pointer-events-none [&:disabled_span]:opacity-100 [&:disabled_svg]:opacity-100`}
						>
							{/* Animated gradient background */}
							{isVideoCompleted &&
								!activityState?.isCompleted &&
								canAccess &&
								!isButtonLoading && (
									<div className="absolute inset-0 z-0 animate-pulse bg-gradient-to-r from-[#3AF4EF] to-[#2ecc71] opacity-80 group-hover:from-green-700 group-hover:to-green-700" />
								)}

							<span className="relative z-10 flex items-center justify-center">
								{getButtonLabel(activity)}
							</span>
						</button>

						{/* Agregar el botón de siguiente clase cuando la actividad está completada y no es la última lección */}
						{activityState?.isCompleted &&
							isNextLessonAvailable &&
							!isButtonLoading &&
							!activityState.isLoading && (
								<div className="mt-4 flex flex-col items-center space-y-2">
									<div className="w-50 border border-b-gray-500" />
									{(() => {
										const nextId = getNextAvailableLessonId();
										return nextId ? (
											<Link
												href={`/estudiantes/clases/${nextId}`}
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
										) : null;
									})()}
								</div>
							)}
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="w-72 p-4">
			<h2 className="text-primary mb-4 text-2xl font-bold">Actividades</h2>
			{/* Activities section */}
			{activities.length > 0 ? (
				<div className="space-y-4">
					{activities
						.slice(0, 3)
						.map((activity, index) => renderActivityCard(activity, index))}
				</div>
			) : (
				<p className="text-gray-600">No hay actividades disponibles</p>
			)}

			{/* Grades section */}
			<div className="mt-4">
				<h2 className="text-primary mb-4 text-2xl font-bold">Calificaciones</h2>
				<LessonGrades
					finalGrade={gradeSummary?.finalGrade ?? null}
					onViewHistoryAction={() => setIsGradeHistoryOpen(true)}
					isLoading={isGradesLoading}
				/>
			</div>

			{/* Resources section */}
			<LessonResource lessonId={lessonId} />

			{selectedActivity && (
				<LessonActivityModal
					isOpen={isModalOpen}
					onClose={handleModalClose}
					activity={selectedActivity}
					onQuestionsAnswered={handleQuestionsAnswered}
					userId={userId}
					markActivityAsCompleted={markActivityAsCompleted}
					onActivityCompleted={handleActivityCompletion}
					courseId={courseId}
					savedResults={activitiesState[selectedActivity.id]?.savedResults}
					onLessonUnlocked={onLessonUnlocked}
					isLastLesson={isLastLesson}
					isLastActivity={isLastActivity}
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
