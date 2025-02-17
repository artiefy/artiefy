'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import { FaRobot } from 'react-icons/fa';
import RecursosLesson from '~/components/estudiantes/layout/RecursosLesson';
import ChatBot from '~/components/estudiantes/layout/ChatBot';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import ClassComments from '~/components/estudiantes/layout/ClassComments';
import LessonActivities from '~/components/estudiantes/layout/LessonActivities';
import LessonCards from '~/components/estudiantes/layout/LessonCards';
import LessonNavigation from '~/components/estudiantes/layout/LessonNavigation';
import LessonPlayer from '~/components/estudiantes/layout/LessonPlayer';
import { useToast } from '~/hooks/use-toast';
import { unlockNextLesson } from '~/server/actions/estudiantes/lessons/unlockNextLesson';
import { completeActivity } from '~/server/actions/estudiantes/progress/completeActivity';
import { updateLessonProgress } from '~/server/actions/estudiantes/progress/updateLessonProgress';
import {
	type Activity,
	type UserLessonsProgress,
	type Lesson,
	type Course,
	type LessonWithProgress,
	type UserActivitiesProgress,
} from '~/types';

export default function LessonDetails({
	lesson,
	activity,
	course,
	lessons,
	userLessonsProgress,
	userActivitiesProgress,
	userId,
}: {
	lesson: LessonWithProgress;
	activity: Activity | null;
	lessons: Lesson[];
	course: Course;
	userLessonsProgress: UserLessonsProgress[];
	userActivitiesProgress: UserActivitiesProgress[];
	userId: string;
}) {
	// State and hooks initialization
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
		lesson.id
	);
	const [progress, setProgress] = useState(lesson.porcentajecompletado);
	const [isVideoCompleted, setIsVideoCompleted] = useState(
		lesson.porcentajecompletado === 100
	);
	const [isActivityCompleted, setIsActivityCompleted] = useState(
		activity?.isCompleted ?? false
	);
	const [isCompletingActivity, setIsCompletingActivity] = useState(false);
	const [lessonsState, setLessonsState] = useState<LessonWithProgress[]>([]);
	const router = useRouter();
	const searchParams = useSearchParams();
	const { toast } = useToast();

	// Initialize lessons state with progress and locked status
	useEffect(() => {
		const initializeLessonsState = () => {
			const lessonsWithProgress = lessons
				.map((lessonItem) => {
					const progress = userLessonsProgress.find(
						(progress) => progress.lessonId === lessonItem.id
					);
					return {
						...lessonItem,
						isLocked: progress ? (progress.isLocked ?? true) : true,
						porcentajecompletado: progress ? progress.progress : 0,
					};
				})
				.sort((a, b) => a.order - b.order);
			setLessonsState(lessonsWithProgress);
		};

		initializeLessonsState();
	}, [lessons, userLessonsProgress]);

	// Usar userActivitiesProgress para algo útil, por ejemplo, mostrar el progreso de las actividades
	useEffect(() => {
		console.log(userActivitiesProgress);
		// Aquí puedes agregar lógica para usar userActivitiesProgress en la interfaz de usuario
	}, [userActivitiesProgress]);

	// Handle lesson navigation
	useEffect(() => {
		if (selectedLessonId !== null && selectedLessonId !== lesson.id) {
			NProgress.start();
			setProgress(0);
			setIsVideoCompleted(false);
			setIsActivityCompleted(false);
			router.push(`/estudiantes/clases/${selectedLessonId}`);
		}
	}, [selectedLessonId, lesson.id, router]);

	// Ensure initial lesson loading is complete
	useEffect(() => {
		NProgress.done();
	}, [searchParams]);

	// Ensure the first lesson is always active and unlocked
	useEffect(() => {
		setLessonsState((prevLessons) =>
			prevLessons.map((l) =>
				l.order === 1
					? {
							...l,
							isLocked: false,
							porcentajecompletado: l.porcentajecompletado,
							isCompleted: l.porcentajecompletado === 100,
						}
					: l
			)
		);
	}, []);

	// Set initial progress and video completion state based on lesson data
	useEffect(() => {
		setProgress(lesson.porcentajecompletado);
		setIsVideoCompleted(lesson.porcentajecompletado === 100);
		setIsActivityCompleted(activity?.isCompleted ?? false);
	}, [lesson, activity]);

	// Redirect if the lesson is locked and not the first lesson
	useEffect(() => {
		if (lesson.isLocked && lesson.order !== 1) {
			toast({
				title: 'Lección bloqueada',
				description:
					'Esta lección está bloqueada. Completa las lecciones anteriores para desbloquearla.',
				variant: 'destructive',
			});

			const timeoutId = setTimeout(() => {
				router.push('/estudiantes');
			}, 3000);

			return () => clearTimeout(timeoutId);
		}
	}, [lesson.isLocked, lesson.order, router, toast]);

	// Handle video end event
	const handleVideoEnd = async () => {
		setProgress(100);
		setIsVideoCompleted(true);
		try {
			await updateLessonProgress(lesson.id, 100);
			setLessonsState((prevLessons) =>
				prevLessons.map((l) =>
					l.id === lesson.id
						? {
								...l,
								porcentajecompletado: 100,
								isCompleted: activity ? false : true,
								isLocked: false,
							}
						: l
				)
			);
			toast({
				title: 'Video Completado',
				description: activity
					? 'Ahora completa la actividad para desbloquear la siguiente clase'
					: 'Has completado la clase',
				variant: 'default',
			});

			// Unlock next lesson if no activity
			if (!activity) {
				const result = await unlockNextLesson(lesson.id);
				if (result.success && 'nextLessonId' in result) {
					setLessonsState((prevLessons) =>
						prevLessons.map((l) =>
							l.id === result.nextLessonId ? { ...l, isLocked: false } : l
						)
					);
					toast({
						title: 'Clase Completada',
						description: '¡Avanzando a la siguiente clase!',
						variant: 'default',
					});

					// Navigate to next lesson
					setTimeout(() => {
						setProgress(0);
						setSelectedLessonId(result.nextLessonId ?? null);
						router.push(`/estudiantes/clases/${result.nextLessonId}`);
					}, 1500);
				}
			}
		} catch (error) {
			console.error('Error al actualizar el progreso de la lección:', error);
			toast({
				title: 'Error',
				description: 'No se pudo actualizar el progreso de la lección.',
				variant: 'destructive',
			});
		}
	};

	// Handle progress update event
	const handleProgressUpdate = async (videoProgress: number) => {
		const roundedProgress = Math.round(videoProgress);
		if (roundedProgress > progress && roundedProgress < 100) {
			setProgress(roundedProgress);
			try {
				await updateLessonProgress(lesson.id, roundedProgress);
				setLessonsState((prevLessons) =>
					prevLessons.map((l) =>
						l.id === lesson.id
							? { ...l, porcentajecompletado: roundedProgress }
							: l
					)
				);
			} catch (error) {
				console.error('Error al actualizar el progreso de la lección:', error);
			}
		}
	};

	// Handle activity completion event
	const handleActivityCompletion = async () => {
		if (!activity || !isVideoCompleted) return;

		setIsCompletingActivity(true);

		try {
			await completeActivity(activity.id);
			setIsActivityCompleted(true);
			setLessonsState((prevLessons) =>
				prevLessons.map((l) =>
					l.id === lesson.id ? { ...l, isCompleted: true } : l
				)
			);

			const result = await unlockNextLesson(lesson.id);
			if (result.success && 'nextLessonId' in result) {
				setLessonsState((prevLessons) =>
					prevLessons.map((l) =>
						l.id === result.nextLessonId ? { ...l, isLocked: false } : l
					)
				);
				toast({
					title: 'Clase Completada',
					description: '¡Avanzando a la siguiente clase!',
					variant: 'default',
				});

				// Navigate to next lesson
				setTimeout(() => {
					setProgress(0);
					setSelectedLessonId(result.nextLessonId ?? null);
					router.push(`/estudiantes/clases/${result.nextLessonId}`);
				}, 1500);
			}
		} catch (error) {
			console.error('Error al completar la actividad:', error);
			toast({
				title: 'Error',
				description: 'No se pudo completar la actividad.',
				variant: 'destructive',
			});
		} finally {
			setIsCompletingActivity(false);
		}
	};

	// Add new effect to handle URL-based lesson unlocking
	useEffect(() => {
		setLessonsState((prevLessons) =>
			prevLessons.map((l) => ({
				...l,
				isLocked:
					l.order === 1
						? false
						: l.id === lesson.id
							? false
							: l.porcentajecompletado > 0
								? false
								: l.isCompleted
									? false
									: l.isLocked,
			}))
		);
	}, [lesson.id]);

	// Function to handle navigation
	const handleNavigation = (direction: 'prev' | 'next') => {
		const sortedLessons = [...lessonsState].sort((a, b) => a.order - b.order);
		const currentIndex = sortedLessons.findIndex(
			(l) => l.id === selectedLessonId
		);

		if (direction === 'prev') {
			for (let i = currentIndex - 1; i >= 0; i--) {
				const prevLesson = sortedLessons[i];
				if (prevLesson && !prevLesson.isLocked) {
					setProgress(0);
					setSelectedLessonId(prevLesson.id);
					router.push(`/estudiantes/clases/${prevLesson.id}`);
					break;
				}
			}
		} else if (direction === 'next') {
			for (let i = currentIndex + 1; i < sortedLessons.length; i++) {
				const nextLesson = sortedLessons[i];
				if (nextLesson && !nextLesson.isLocked) {
					setProgress(0);
					setSelectedLessonId(nextLesson.id);
					router.push(`/estudiantes/clases/${nextLesson.id}`);
					break;
				}
			}
		}
	};

	return (
		<>
			<Header />
			<div className="flex min-h-screen flex-col bg-background">
				<div className="flex flex-1 px-4 py-6">
					{/* Left Sidebar */}
					<div className="w-80 bg-background p-4 shadow-lg">
						<h2 className="mb-4 text-2xl font-bold text-primary">Cursos</h2>
						<LessonCards
							lessonsState={lessonsState}
							selectedLessonId={selectedLessonId}
							setSelectedLessonId={setSelectedLessonId}
							course={course}
							progress={progress}
						/>
					</div>

					{/* Main Content */}
					<div className="flex-1 p-6">
						<LessonNavigation
							handleNavigation={handleNavigation}
							lessonsState={lessonsState}
							lessonOrder={lesson.order}
						/>
						<LessonPlayer
							lesson={lesson}
							progress={progress}
							handleVideoEnd={handleVideoEnd}
							handleProgressUpdate={handleProgressUpdate}
						/>
						<ClassComments lessonId={lesson.id} />
					</div>
					{/* Right Sidebar - Activities and Resources */}
					<div className="flex flex-col">
						<LessonActivities
							activity={activity}
							isVideoCompleted={isVideoCompleted}
							isActivityCompleted={isActivityCompleted}
							isCompletingActivity={isCompletingActivity}
							handleActivityCompletion={handleActivityCompletion}
							userId={userId}
						/>
						<RecursosLesson resourceNames={lesson.resourceNames} />
					</div>

					{/* Chatbot Button and Modal */}
					<button
						onClick={() => setIsChatOpen(!isChatOpen)}
						className="fixed right-6 bottom-6 rounded-full bg-blue-500 p-4 text-white shadow-lg transition-colors hover:bg-blue-600"
					>
						<FaRobot className="text-xl" />
					</button>

					<ChatBot />
				</div>
				<Footer />
			</div>
		</>
	);
}
