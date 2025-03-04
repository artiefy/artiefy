import { useState } from 'react';
import Link from 'next/link';
import { FaCheckCircle, FaLock, FaArrowDown } from 'react-icons/fa';
import { PiArrowFatLineLeftFill } from 'react-icons/pi';
import { toast } from 'sonner';
import { Button } from '~/components/estudiantes/ui/button';
import type { Activity, ActivityResults, SavedAnswer } from '~/types';
import LessonActivityModal from './LessonActivityModal';

interface LessonActivitiesProps {
	activity: Activity | null;
	isVideoCompleted: boolean;
	isActivityCompleted: boolean;
	handleActivityCompletion: () => Promise<void>;
	userId: string;
	nextLessonId?: number;
}

interface SavedResults {
	score: number;
	answers: Record<string, SavedAnswer>;
}

const LessonActivities = ({
	activity,
	isVideoCompleted,
	isActivityCompleted,
	handleActivityCompletion,
	userId,
	nextLessonId,
}: LessonActivitiesProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [activityCompleted, setActivityCompleted] =
		useState(isActivityCompleted);

	const [savedResults, setSavedResults] = useState<SavedResults | null>(null);

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

	const fetchSavedResults = async () => {
		if (!activity?.id) return;

		try {
			console.log(
				'Fetching results for activity:',
				activity.id,
				'user:',
				userId
			);
			const response = await fetch(
				`/api/activities/getAnswers?activityId=${activity.id}&userId=${userId}`
			);

			if (!response.ok) {
				if (response.status === 404) {
					console.log('No saved results found');
					return;
				}
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = (await response.json()) as ActivityResults;
			console.log('Fetched results:', data);

			setSavedResults({
				score: data.score,
				answers: data.answers,
			});
		} catch (error) {
			console.error('Error fetching saved results:', error);
			toast.error('Error al cargar los resultados guardados');
		}
	};

	const handleCompletedActivityClick = async () => {
		if (activityCompleted) {
			await fetchSavedResults();
			openModal();
		} else {
			openModal();
		}
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
							<FaArrowDown className="animate-bounce-up-down my-4 mb-1 text-green-500" />{' '}
						</div>
					)}
					<Button
						onClick={
							activityCompleted ? handleCompletedActivityClick : openModal
						}
						className={`mt-2 w-full ${
							activityCompleted
								? 'bg-green-500 text-white hover:bg-green-600'
								: isVideoCompleted
									? 'bg-[#00BDD8] text-white hover:bg-[#00A5C0]'
									: 'bg-gray-400 text-background'
						}`}
						disabled={!isVideoCompleted}
					>
						{activityCompleted ? (
							<>
								Actividad Completada <FaCheckCircle className="ml-2" />
							</>
						) : (
							'Ver Actividad'
						)}
					</Button>
					{activityCompleted && nextLessonId && (
						<Link href={`/estudiantes/clases/${nextLessonId}`}>
							<Button className="next-lesson-base next-lesson-gradient hover:next-lesson-gradient-hover">
								<span className="next-lesson-content">
									Siguiente Clase <PiArrowFatLineLeftFill className="ml-2" />
								</span>
								<div className="next-lesson-overlay" />
							</Button>
						</Link>
					)}
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
				/>
			)}
		</div>
	);
};

export default LessonActivities;
