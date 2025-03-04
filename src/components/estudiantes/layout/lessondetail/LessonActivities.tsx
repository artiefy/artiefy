import { useState } from 'react';
import Link from 'next/link';
import { FaCheckCircle, FaLock, FaArrowDown } from 'react-icons/fa';
import { PiArrowFatLinesLeft } from 'react-icons/pi';
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
					<div className="space-y-2">
						<Button
							onClick={handleCompletedActivityClick}
							disabled={!isVideoCompleted}
							className={`relative w-full overflow-hidden ${
								activityCompleted
									? 'bg-green-500 text-white hover:bg-green-700'
									: isVideoCompleted
										? 'font-semibold text-black hover:text-green-800'
										: 'bg-gray-400 text-background'
							}`}
						>
							{/* Fondo animado solo para el estado activo no completado */}
							{isVideoCompleted && !activityCompleted && (
								<div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#3AF4EF] to-[#2ecc71] hover:from-[#2ecc71] hover:to-[#3AF4EF]" />
							)}

							{/* Texto siempre por encima del gradiente */}
							<span className="relative z-10">
								{activityCompleted ? (
									<>
										Ver Resultados{' '}
										<FaCheckCircle className="ml-2 inline text-white" />
									</>
								) : (
									'Ver Actividad'
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
									<span className="mt-1 text-sm text-gray-600 group-hover:text-blue-500">
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
				/>
			)}
		</div>
	);
};

export default LessonActivities;
