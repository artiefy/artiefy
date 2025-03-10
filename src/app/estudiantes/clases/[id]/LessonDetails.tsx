'use client';
import { useState, useEffect } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useProgress } from '@bprogress/next';
import { useUser } from '@clerk/nextjs';
import { formatInTimeZone } from 'date-fns-tz';
import { FaRobot } from 'react-icons/fa';
import { toast } from 'sonner';

import LessonActivities from '~/components/estudiantes/layout/lessondetail/LessonActivities';
import LessonCards from '~/components/estudiantes/layout/lessondetail/LessonCards';
import LessonChatBot from '~/components/estudiantes/layout/lessondetail/LessonChatbot';
import ClassComments from '~/components/estudiantes/layout/lessondetail/LessonComments';
import LessonNavigation from '~/components/estudiantes/layout/lessondetail/LessonNavigation';
import LessonPlayer from '~/components/estudiantes/layout/lessondetail/LessonPlayer';
import RecursosLesson from '~/components/estudiantes/layout/lessondetail/LessonResource';
import { unlockNextLesson } from '~/server/actions/estudiantes/lessons/unlockNextLesson';
import { completeActivity } from '~/server/actions/estudiantes/progress/completeActivity';
import { updateLessonProgress } from '~/server/actions/estudiantes/progress/updateLessonProgress';
import {
	type Activity,
	type UserLessonsProgress,
	type Lesson,
	type LessonWithProgress,
	type UserActivitiesProgress,
} from '~/types';
import {
	saveScrollPosition,
	restoreScrollPosition,
} from '~/utils/scrollPosition';

const TIME_ZONE = 'America/Bogota';

export default function LessonDetails({
	lesson,
	activity,
	lessons,
	userLessonsProgress,
	userActivitiesProgress,
	userId,
}: {
	lesson: LessonWithProgress;
	activity: Activity | null;
	lessons: Lesson[];
	userLessonsProgress: UserLessonsProgress[];
	userActivitiesProgress: UserActivitiesProgress[];
	userId: string;
}) {
	// Add new state
	const [isNavigating, setIsNavigating] = useState(false);
	// State and hooks initialization
	const { user } = useUser();
	const router = useRouter();
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
		lesson?.id ?? null
	);
	const [progress, setProgress] = useState(lesson?.porcentajecompletado ?? 0);
	const [isVideoCompleted, setIsVideoCompleted] = useState(
		lesson?.porcentajecompletado === 100
	);
	const [isActivityCompleted, setIsActivityCompleted] = useState(
		activity?.isCompleted ?? false
	);
	const [lessonsState, setLessonsState] = useState<LessonWithProgress[]>([]);
	const searchParams = useSearchParams();
	const { start, stop } = useProgress();

	// Show loading progress on initial render
	useEffect(() => {
		start();
		return () => stop();
	}, [start, stop]);

	// Initialize lessons state with progress and locked status
	useEffect(() => {
		const initializeLessonsState = () => {
			// Ordenar lecciones por título primero
			const sortedLessons = [...lessons].sort((a, b) =>
				a.title.localeCompare(b.title, undefined, { numeric: true })
			);

			const lessonsWithProgress = sortedLessons.map((lessonItem, index) => {
				const progress = userLessonsProgress.find(
					(p) => p.lessonId === lessonItem.id
				);

				// La primera lección (por título) siempre está desbloqueada
				if (index === 0) {
					return {
						...lessonItem,
						isLocked: false,
						porcentajecompletado: progress?.progress ?? 0,
						isCompleted: progress?.isCompleted ?? false,
						isNew: progress?.isNew ?? true, // Agregar propiedad isNew
					};
				}

				// Para las demás lecciones, verificar si la anterior está completada
				const previousLesson = userLessonsProgress.find(
					(p) => p.lessonId === sortedLessons[index - 1].id
				);

				return {
					...lessonItem,
					isLocked: !(previousLesson?.isCompleted ?? false),
					porcentajecompletado: progress?.progress ?? 0,
					isCompleted: progress?.isCompleted ?? false,
					isNew: progress?.isNew ?? true, // Agregar propiedad isNew
				};
			});

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
		if (selectedLessonId !== null && selectedLessonId !== lesson?.id) {
			saveScrollPosition();
			setProgress(0);
			setIsVideoCompleted(false);
			setIsActivityCompleted(false);
			router.push(`/estudiantes/clases/${selectedLessonId}`);
		}
	}, [selectedLessonId, lesson?.id, router]);

	// Restore scroll position on route change
	useEffect(() => {
		restoreScrollPosition();
	}, [lesson?.id]);

	// Set initial progress and video completion state based on lesson data
	useEffect(() => {
		setProgress(lesson?.porcentajecompletado ?? 0);
		setIsVideoCompleted(lesson?.porcentajecompletado === 100);
		setIsActivityCompleted(activity?.isCompleted ?? false);
	}, [lesson, activity]);

	// Redirect if the lesson is locked
	useEffect(() => {
		let redirectTimeout: NodeJS.Timeout;

		if (lesson?.isLocked) {
			// Usar una única función para manejar el toast y la redirección
			const handleLockedLesson = () => {
				// Limpiar cualquier timeout existente
				if (redirectTimeout) clearTimeout(redirectTimeout);

				// Mostrar un único toast
				toast.error('Lección bloqueada', {
					description:
						'Completa las lecciones anteriores para desbloquear esta clase.',
					// Evitar que el toast se muestre múltiples veces
					id: 'lesson-locked',
				});

				// Configurar la redirección con un nuevo timeout
				redirectTimeout = setTimeout(() => {
					router.replace('/estudiantes');
				}, 2000);
			};

			handleLockedLesson();

			// Limpiar el timeout si el componente se desmonta
			return () => {
				if (redirectTimeout) clearTimeout(redirectTimeout);
			};
		}
	}, [lesson?.isLocked, router]);

	// Handle video end event
	const handleVideoEnd = async () => {
		try {
			// Call handleLessonCompletion instead of duplicating logic
			await handleLessonCompletion();

			// Only handle activity-specific logic here
			if (!activity) {
				await unlockNextClass();
			}
		} catch (error) {
			console.error('Error:', error);
			toast.error('Error al actualizar el progreso');
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
							? {
									...l,
									porcentajecompletado: roundedProgress,
									isNew: roundedProgress > 1 ? false : l.isNew, // Cambiar isNew a false si el progreso es mayor al 1%
								}
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

		try {
			await completeActivity(activity.id);
			setIsActivityCompleted(true);
			await unlockNextClass();

			// Solo mostrar un único toast aquí
			toast.success('¡Actividad completada!', {
				description:
					'La siguiente clase ha sido desbloqueada. Puedes acceder a ella desde el menú de lecciones.',
			});
		} catch (error) {
			console.error('Error:', error);
			toast.error('Error al completar la actividad');
		}
	};

	// Add new effect to handle URL-based lesson unlocking
	useEffect(() => {
		if (!lesson?.isLocked && !isVideoCompleted) {
			setProgress(lesson?.porcentajecompletado ?? 0);
			setIsVideoCompleted(lesson?.porcentajecompletado === 100);
		}
	}, [lesson, isVideoCompleted]);

	// Function to handle navigation
	const handleNavigationClick = async (direction: 'prev' | 'next') => {
		if (isNavigating) return;
		const sortedLessons = [...lessonsState].sort((a, b) =>
			a.title.localeCompare(b.title)
		);
		const currentIndex = sortedLessons.findIndex(
			(l) => l.id === selectedLessonId
		);

		const targetLesson =
			direction === 'prev'
				? sortedLessons
						.slice(0, currentIndex)
						.reverse()
						.find((l) => !l.isLocked)
				: sortedLessons.slice(currentIndex + 1).find((l) => !l.isLocked);

		if (targetLesson) {
			await navigateWithProgress(targetLesson.id);
		}
	};

	// Handle progress bar on route changes
	useEffect(() => {
		stop();
	}, [searchParams, stop]);

	// Handle lesson card click
	const handleCardClick = async (targetId: number) => {
		if (!isNavigating && targetId !== selectedLessonId) {
			await navigateWithProgress(targetId);
		}
	};

	// Helper function for navigation with progress
	const navigateWithProgress = async (targetId: number) => {
		if (isNavigating) return;

		setIsNavigating(true);
		start();

		try {
			saveScrollPosition();
			// Store the navigation button element position
			const navigationElement = document.querySelector('.navigation-buttons');
			const yOffset = navigationElement?.getBoundingClientRect().top ?? 0;
			const scrollPosition = yOffset + window.scrollY + 40; // Add 200px to scroll further down

			await Promise.all([
				new Promise((resolve) => setTimeout(resolve, 300)),
				router.push(`/estudiantes/clases/${targetId}`, { scroll: false }),
			]);
			restoreScrollPosition();
			// Scroll to the navigation buttons after route change
			window.scrollTo({
				top: scrollPosition,
				behavior: 'smooth',
			});

			await new Promise((resolve) => setTimeout(resolve, 200));

			setSelectedLessonId(targetId);
			setProgress(0);
			setIsVideoCompleted(false);
			setIsActivityCompleted(false);
		} finally {
			stop();
			setIsNavigating(false);
		}
	};

	// Add new effect to check subscription status
	useEffect(() => {
		const checkSubscriptionStatus = () => {
			const subscriptionStatus = user?.publicMetadata?.subscriptionStatus;
			const rawSubscriptionEndDate = user?.publicMetadata
				?.subscriptionEndDate as string | null;

			console.log('Subscription Status:', subscriptionStatus); // Debug log
			console.log('Raw Subscription End Date:', rawSubscriptionEndDate); // Debug log

			const formattedSubscriptionEndDate = rawSubscriptionEndDate
				? formatInTimeZone(
						new Date(rawSubscriptionEndDate),
						TIME_ZONE,
						'yyyy-MM-dd HH:mm:ss'
					)
				: null;

			console.log(
				'Formatted Subscription End Date (Bogotá):',
				formattedSubscriptionEndDate
			); // Debug log

			const isSubscriptionActive =
				subscriptionStatus === 'active' &&
				(!formattedSubscriptionEndDate ||
					new Date(formattedSubscriptionEndDate) > new Date());

			if (!isSubscriptionActive) {
				toast.error(
					'Debes tener una suscripción activa para poder ver las clases.'
				);
				void router.push('/planes');
			}
		};

		checkSubscriptionStatus();
	}, [user, router]);

	// Nuevo manejador para completar lecciones
	const handleLessonCompletion = async () => {
		try {
			setProgress(100);
			setIsVideoCompleted(true);

			await updateLessonProgress(lesson.id, 100);

			// Corregir el tipo manteniendo todas las propiedades requeridas
			setLessonsState((prevLessons) =>
				prevLessons.map((l) =>
					l.id === lesson.id
						? {
								...l, // Mantener todas las propiedades existentes
								porcentajecompletado: 100,
								isCompleted: !activity,
								isLocked: false,
							}
						: l
				)
			);

			toast.success('Clase completada', {
				description: activity
					? 'Ahora completa la actividad para continuar'
					: '¡La siguiente clase ha sido desbloqueada!',
			});
		} catch (error) {
			console.error('Error:', error);
			toast.error('Error al completar la lección');
			throw error;
		}
	};

	// Actualizar el manejador para desbloquear siguiente clase
	const unlockNextClass = async () => {
		const result = await unlockNextLesson(lesson.id);

		if (result.success && result.nextLessonId) {
			setLessonsState((prevLessons) =>
				prevLessons.map((l) =>
					l.id === result.nextLessonId
						? {
								...l,
								isLocked: false,
								porcentajecompletado: 0,
							}
						: l
				)
			);

			// Remover la navegación automática
			// await handleAutoNavigation(result.nextLessonId);
		}
	};

	// Add function to get next lesson ID
	const getNextLessonId = () => {
		const sortedLessons = [...lessonsState].sort((a, b) =>
			a.title.localeCompare(b.title)
		);
		const currentIndex = sortedLessons.findIndex((l) => l.id === lesson.id);
		const nextLesson = sortedLessons[currentIndex + 1];
		return nextLesson && !nextLesson.isLocked ? nextLesson.id : undefined;
	};

	return (
		<div className="flex min-h-screen flex-col">
			<div className="flex flex-1 px-4 py-6">
				{/* Left Sidebar */}
				<div className="w-80 bg-background p-4">
					<h2 className="mb-4 text-2xl font-bold text-primary">Cursos</h2>
					<LessonCards
						lessonsState={lessonsState}
						selectedLessonId={selectedLessonId}
						onLessonClick={handleCardClick}
						progress={progress}
						isNavigating={isNavigating}
					/>
				</div>

				{/* Main Content */}
				<div className="flex-1 p-6">
					<div className="navigation-buttons">
						{' '}
						{/* Add this wrapper div with class */}
						<LessonNavigation
							onNavigate={handleNavigationClick}
							lessonsState={lessonsState}
							lessonOrder={new Date(lesson.createdAt).getTime()}
							isNavigating={isNavigating}
						/>
					</div>
					<LessonPlayer
						lesson={lesson}
						progress={progress}
						handleVideoEnd={handleVideoEnd}
						handleProgressUpdate={handleProgressUpdate}
					/>
					<ClassComments lessonId={lesson.id} />
				</div>

				{/* Right Sidebar */}
				<div className="flex flex-col">
					<LessonActivities
						activity={
							activity ?? {
								id: 0, // Use 0 instead of null
								name: '',
								description: '',
								lessonsId: lesson.id,
								content: {
									// Match the expected type
									questions: [],
								},
								isCompleted: false,
								userProgress: 0,
								lastUpdated: new Date(),
								revisada: false,
								porcentaje: 0,
								parametroId: null,
								createdAt: new Date(),
								fechaMaximaEntrega: null,
								typeid: 0,
							}
						}
						isVideoCompleted={isVideoCompleted}
						isActivityCompleted={isActivityCompleted}
						handleActivityCompletion={handleActivityCompletion}
						userId={userId}
						nextLessonId={getNextLessonId()} // Add this prop
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

				<LessonChatBot />
			</div>
		</div>
	);
}
