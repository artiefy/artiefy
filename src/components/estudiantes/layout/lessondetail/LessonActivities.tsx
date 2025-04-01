import { useState, useEffect } from 'react';

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
	nextLessonId?: number;
	onLessonUnlocked: (lessonId: number) => void;
	courseId: number;
	isLastLesson: boolean;
	isLastActivity: boolean;
	resourceNames: string[];
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
	nextLessonId,
	onLessonUnlocked,
	courseId,
	isLastLesson,
	isLastActivity,
	resourceNames: _resourceNames,
}: LessonActivitiesProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const [savedResults, setSavedResults] = useState<SavedResults | null>(null);
	const [isLoadingResults, setIsLoadingResults] = useState(false);
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
			setCompletedActivities((prev) => ({
				...prev,
				[selectedActivity.id]: true,
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

				for (const activity of activities.slice(0, 3)) {
					const response = await fetch(
						`/api/activities/getAnswers?activityId=${activity.id}&userId=${userId}`
					);

					if (response.ok) {
						const rawData: unknown = await response.json();
						if (
							isActivityAnswersResponse(rawData) &&
							rawData.answers &&
							Object.keys(rawData.answers).length > 0
						) {
							statuses[activity.id] = true;
						}
					}
				}

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
		setIsLoadingResults(true);
		try {
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
					if (isLastActivity) {
						setCompletedActivities((prev) => ({
							...prev,
							[activity.id]: true,
						}));
					}
				}
			}
		} catch (e) {
			if (e instanceof Error) {
				console.error('Error fetching saved results:', e.message);
			} else {
				console.error('Unknown error fetching saved results');
			}
			toast.error('Error al cargar los resultados guardados');
		} finally {
			setIsLoadingResults(false);
			openModal();
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

		const order = currentActivity.createdAt
			? new Date(currentActivity.createdAt).getTime()
			: currentActivity.id;

		const maxOrder = Math.max(
			...activities.map((act) =>
				act.createdAt ? new Date(act.createdAt).getTime() : act.id
			)
		);

		return order === maxOrder;
	};

	const handleModalClose = () => {
		closeModal();
		setSavedResults(null);
		setSelectedActivity(null);
	};

	const getButtonClasses = (activity: Activity, isLastActivity: boolean) => {
		return completedActivities[activity.id] || (isLastActivity && savedResults)
			? 'bg-green-500 text-white hover:bg-green-700 active:scale-95'
			: isVideoCompleted
				? 'font-semibold text-black'
				: 'bg-gray-400 text-background';
	};

	const isLastCompletedActivity = (activity: Activity) => {
		const activityIndex = activities.indexOf(activity);
		return (
			activityIndex === Math.min(activities.length - 1, 2) &&
			completedActivities[activity.id]
		);
	};

	const getActivityStatus = (activity: Activity, index: number) => {
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

		// Other activities are locked until previous activity is completed
		const previousActivity = activities[index - 1];
		const isPreviousCompleted =
			previousActivity && completedActivities[previousActivity.id];

		return {
			icon: <FaLock className="text-gray-400" />,
			bgColor: 'bg-gray-200',
			isActive: isPreviousCompleted ?? false,
		};
	};

	return (
		<div className="w-72 p-4">
			<h2 className="mb-4 text-2xl font-bold text-primary">Actividades</h2>
			{activities.length > 0 ? (
				<div className="max-h-[calc(100vh-200px)] space-y-4 overflow-y-auto">
					{activities.slice(0, 3).map((activity, index) => {
						const status = getActivityStatus(activity, index);
						const isFirstActivity = index === 0;
						const canAccess =
							isFirstActivity || completedActivities[activities[0]?.id];

						return (
							<div
								key={activity.id}
								className={`mb-4 rounded-lg border p-4 ${
									status.isActive ? 'bg-white' : 'bg-gray-100 opacity-60'
								}`}
							>
								<div className="flex items-center justify-between">
									<div className="flex-1">
										<h3 className="font-semibold text-gray-900">
											{activity.name}
										</h3>
									</div>
									<div className="ml-2">
										<div className={`rounded-full p-1 ${status.bgColor}`}>
											{status.icon}
										</div>
									</div>
								</div>

								<p className="mt-2 text-sm text-gray-600">
									{activity.description}
								</p>

								<div className="space-y-2">
									{isVideoCompleted &&
										isFirstActivity &&
										!completedActivities[activity.id] && (
											<div className="flex justify-center py-2">
												<MdKeyboardDoubleArrowDown className="size-10 animate-bounce-up-down text-2xl text-green-500" />
											</div>
										)}

									{completedActivities[activity.id] && (
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
										disabled={
											!isVideoCompleted || isButtonLoading || !canAccess
										}
										className={`group relative w-full overflow-hidden rounded-md px-4 py-2 transition-all duration-300 ${getButtonClasses(activity, isLastActivity)} ${!canAccess ? 'cursor-not-allowed bg-gray-200' : ''} [&:disabled]:bg-opacity-50 disabled:pointer-events-none [&:disabled_span]:opacity-100 [&:disabled_svg]:opacity-100`}
									>
										{/* Animated gradient background - only show when video completed and activity not completed */}
										{isVideoCompleted &&
											!completedActivities[activity.id] &&
											canAccess && (
												<div className="absolute inset-0 z-0 animate-pulse bg-gradient-to-r from-[#3AF4EF] to-[#2ecc71] opacity-80 group-hover:from-green-700 group-hover:to-green-700" />
											)}

										<span className="relative z-10 flex items-center justify-center">
											{isButtonLoading ? (
												<div className="flex items-center gap-2">
													<Icons.spinner className="h-4 w-4 animate-spin text-background" />
													<span className="font-semibold text-background">
														Cargando...
													</span>
												</div>
											) : completedActivities[activity.id] ? (
												<>
													{isLoadingResults && (
														<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
													)}
													<span className="font-semibold">Ver Resultados</span>
													<FaCheckCircle className="ml-2 inline text-white" />
												</>
											) : (
												<>
													{isLoadingActivity &&
														activity.id === selectedActivity?.id && (
															<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
														)}
													<span>Ver Actividad</span>
												</>
											)}
										</span>
									</button>

									{isLastCompletedActivity(activity) && nextLessonId && (
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
						);
					})}
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
