'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useProgress } from '@bprogress/next';
import { useUser } from '@clerk/nextjs';
import { FaRobot } from 'react-icons/fa';
import { toast } from 'sonner';

import LessonActivities from '~/components/estudiantes/layout/lessondetail/LessonActivities';
import LessonBreadcrumbs from '~/components/estudiantes/layout/lessondetail/LessonBreadcrumbs';
import LessonCards from '~/components/estudiantes/layout/lessondetail/LessonCards';
import LessonChatBot from '~/components/estudiantes/layout/lessondetail/LessonChatbot';
import LessonComments from '~/components/estudiantes/layout/lessondetail/LessonComments';
import LessonNavigation from '~/components/estudiantes/layout/lessondetail/LessonNavigation';
import LessonPlayer from '~/components/estudiantes/layout/lessondetail/LessonPlayer';
import { isUserEnrolled } from '~/server/actions/estudiantes/courses/enrollInCourse';
import { completeActivity } from '~/server/actions/estudiantes/progress/completeActivity';
import { updateLessonProgress } from '~/server/actions/estudiantes/progress/updateLessonProgress';
import {
	type Activity,
	type UserLessonsProgress,
	type Lesson,
	type LessonWithProgress,
	type UserActivitiesProgress,
	type Course,
} from '~/types';
import { sortLessons } from '~/utils/lessonSorting';
import {
	saveScrollPosition,
	restoreScrollPosition,
} from '~/utils/scrollPosition';

interface LessonDetailsProps {
	lesson: LessonWithProgress;
	activities: Activity[]; // Change from activity to activities
	lessons: Lesson[];
	userLessonsProgress: UserLessonsProgress[];
	userActivitiesProgress: UserActivitiesProgress[];
	userId: string;
	course: Course;
}

// Move these hooks to the top level
const isLastLesson = (lessons: LessonWithProgress[], currentId: number) => {
	const sortedLessons = sortLessons(lessons);
	const currentIndex = sortedLessons.findIndex((l) => l.id === currentId);
	return currentIndex === sortedLessons.length - 1;
};

const isLastActivity = (
	lessons: LessonWithProgress[],
	activities: Activity[],
	currentLesson: LessonWithProgress
) => {
	if (!lessons.length || !activities.length) return false;
	const sortedLessons = sortLessons(lessons);
	const lastLesson = sortedLessons[sortedLessons.length - 1];
	const isCurrentLessonLast = currentLesson?.id === lastLesson?.id;
	if (!isCurrentLessonLast) return false;
	const lastActivity = activities[activities.length - 1];
	return activities[0]?.id === lastActivity?.id;
};

export default function LessonDetails({
	lesson,
	activities = [],
	lessons = [],
	userLessonsProgress = [],
	userActivitiesProgress = [],
	userId,
	course,
}: LessonDetailsProps) {
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
	// Update to use first activity's completion status
	const [isActivityCompleted, setIsActivityCompleted] = useState(
		activities[0]?.isCompleted ?? false
	);
	// Inicializar lessonsState con un valor predeterminado
	const [lessonsState, setLessonsState] = useState<LessonWithProgress[]>(() =>
		lessons.map((lessonItem) => ({
			...lessonItem,
			isLocked: true,
			porcentajecompletado: 0,
			isCompleted: false,
			isNew: true,
			courseTitle: lesson.courseTitle,
		}))
	);

	// Mover la inicialización de estados al useEffect con una bandera
	const [isInitialLoad, setIsInitialLoad] = useState(true);

	const searchParams = useSearchParams();
	const { start, stop } = useProgress();

	// Add isInitialized ref to prevent infinite loop
	const isInitialized = useRef(false);

	// Move course active check to the top
	useEffect(() => {
		if (!course.isActive) {
			toast.error('Curso no disponible', {
				description: 'Este curso no está disponible actualmente.',
			});
			router.push('/estudiantes');
		}
	}, [course.isActive, router]);

	useEffect(() => {
		if (!isInitialized.current) {
			setProgress(lesson?.porcentajecompletado ?? 0);
			setIsVideoCompleted(lesson?.porcentajecompletado === 100);
			setIsActivityCompleted(activities[0]?.isCompleted ?? false);
			isInitialized.current = true;
		}
	}, [lesson?.porcentajecompletado, activities]);

	// Show loading progress on initial render
	useEffect(() => {
		start();
		return () => stop();
	}, [start, stop]);

	// Mover la inicialización de lecciones a un useEffect
	useEffect(() => {
		if (isInitialLoad && lessons.length > 0) {
			const initializeLessonsState = () => {
				const sortedLessons = [...lessons].sort((a, b) => {
					// Special handling for "Bienvenida"
					if (a.title.toLowerCase().includes('bienvenida')) return -1;
					if (b.title.toLowerCase().includes('bienvenida')) return 1;

					// Extract and compare lesson numbers
					const aMatch = /^(\d+)/.exec(a.title);
					const bMatch = /^(\d+)/.exec(b.title);
					const aNum = aMatch
						? parseInt(aMatch[1], 10)
						: Number.MAX_SAFE_INTEGER;
					const bNum = bMatch
						? parseInt(bMatch[1], 10)
						: Number.MAX_SAFE_INTEGER;
					return aNum - bNum;
				});

				const lessonsWithProgress = sortedLessons.map((lessonItem, index) => {
					const progress = userLessonsProgress.find(
						(p) => p.lessonId === lessonItem.id
					);

					const isFirst =
						index === 0 ||
						lessonItem.title.toLowerCase().includes('bienvenida');

					return {
						...lessonItem,
						isLocked: isFirst ? false : (progress?.isLocked ?? true),
						porcentajecompletado: progress?.progress ?? 0,
						isCompleted: progress?.isCompleted ?? false,
						isNew: progress?.isNew ?? true,
						courseTitle: lesson.courseTitle,
					};
				});

				setLessonsState(lessonsWithProgress);
				setIsInitialLoad(false);
			};

			initializeLessonsState();
		}
	}, [
		isInitialLoad,
		lessons,
		userLessonsProgress,
		lesson.courseTitle,
		setLessonsState,
	]);

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
			void router.push(`/estudiantes/clases/${selectedLessonId}`);
		}
	}, [selectedLessonId, lesson?.id, router]);

	// Restore scroll position on route change
	useEffect(() => {
		restoreScrollPosition();
	}, [lesson?.id]);

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
					void router.replace(`/estudiantes/cursos/${lesson.courseId}`);
				}, 2000);
			};

			handleLockedLesson();

			// Limpiar el timeout si el componente se desmonta
			return () => {
				if (redirectTimeout) clearTimeout(redirectTimeout);
			};
		}
	}, [lesson?.isLocked, lesson.courseId, router]);

	// Verificar si el usuario está inscrito en el curso
	useEffect(() => {
		const checkEnrollment = async () => {
			const isEnrolled = await isUserEnrolled(lesson.courseId, userId);
			if (!isEnrolled) {
				toast.error('Debes estar inscrito en el curso para ver esta lección.');
				void router.replace(`/estudiantes/cursos/${lesson.courseId}`);
			}
		};

		void checkEnrollment();
	}, [lesson.courseId, userId, router]);

	// Update this function to properly handle async/await
	const handleProgressUpdate = useCallback(
		async (videoProgress: number) => {
			const roundedProgress = Math.round(videoProgress);

			// Only update if progress is different from current
			if (roundedProgress !== progress) {
				try {
					// Update local state immediately
					setProgress(roundedProgress);

					// Update lessons state
					setLessonsState((prevLessons) =>
						prevLessons.map((l) =>
							l.id === lesson.id
								? {
										...l,
										porcentajecompletado: roundedProgress,
										isCompleted: roundedProgress === 100,
										isNew: roundedProgress > 1 ? false : l.isNew,
									}
								: l
						)
					);

					// Update database
					await updateLessonProgress(lesson.id, roundedProgress);
				} catch (error) {
					console.error('Error al actualizar el progreso:', error);
					toast.error('Error al sincronizar el progreso');
				}
			}
		},
		[progress, lesson.id, setLessonsState]
	);

	// Update video end handler
	const handleVideoEnd = async () => {
		try {
			await handleProgressUpdate(100);
			setIsVideoCompleted(true);

			toast.success('Clase completada', {
				description: activities.length
					? 'Ahora completa la actividad para continuar'
					: 'Video completado exitosamente',
			});
		} catch (error) {
			console.error('Error al completar la lección:', error);
			toast.error('Error al marcar la lección como completada');
		}
	};

	// Handle activity completion event
	const handleActivityCompletion = async () => {
		if (!activities.length || !isVideoCompleted) return;

		try {
			await completeActivity(activities[0].id, userId); // Add userId parameter
			setIsActivityCompleted(true);

			// Remove automatic unlocking - let modal handle it
			toast.success('¡Actividad completada!');
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
			const navigationElement = document.querySelector('.navigation-buttons');
			const yOffset = navigationElement?.getBoundingClientRect().top ?? 0;
			const scrollPosition = yOffset + window.scrollY + 40;

			await Promise.all([
				new Promise((resolve) => setTimeout(resolve, 300)),
				router.push(`/estudiantes/clases/${targetId}`, { scroll: false }),
			]);
			restoreScrollPosition();
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

	// Keep subscription check but remove the loading UI
	useEffect(() => {
		if (!user || course.courseType?.requiredSubscriptionLevel === 'none') {
			return;
		}

		const metadata = user.publicMetadata as {
			planType?: string;
			subscriptionStatus?: string;
			subscriptionEndDate?: string;
		};

		if (!metadata.subscriptionStatus || !metadata.subscriptionEndDate) {
			toast.error('Se requiere una suscripción activa para ver las clases');
			void router.push('/planes');
			return;
		}

		const isActive = metadata.subscriptionStatus === 'active';
		const endDate = new Date(metadata.subscriptionEndDate);
		const isValid = endDate > new Date();

		if (!isActive || !isValid) {
			toast.error('Se requiere una suscripción activa para ver las clases');
			void router.push('/planes');
		}
	}, [user, course.courseType?.requiredSubscriptionLevel, router]);

	// Add safety check for lesson
	if (!lesson) {
		return (
			<div className="flex h-screen items-center justify-center">
				<p>Lección no encontrada</p>
			</div>
		);
	}

	// Function to handle lesson unlock
	const handleLessonUnlocked = (lessonId: number) => {
		setLessonsState((prevLessons) =>
			prevLessons.map((lesson) =>
				lesson.id === lessonId
					? { ...lesson, isLocked: false, isNew: true }
					: lesson
			)
		);
	};

	return (
		<div className="flex min-h-screen flex-col">
			<LessonBreadcrumbs
				courseTitle={lesson.courseTitle}
				courseId={lesson.courseId}
				lessonTitle={lesson.title}
			/>
			<div className="flex flex-1 px-4 py-6">
				{/* Left Sidebar */}
				<div className="bg-background w-80 p-4">
					<h2 className="text-primary mb-4 text-2xl font-bold">Clases</h2>
					<LessonCards
						lessonsState={lessonsState}
						selectedLessonId={selectedLessonId}
						onLessonClick={handleCardClick}
						progress={progress}
						isNavigating={isNavigating}
						setLessonsState={setLessonsState} // Add this prop
					/>
				</div>

				{/* Main Content */}
				<div className="flex-1 p-6">
					<div className="navigation-buttons">
						<div className="mb-4">
							<LessonNavigation
								onNavigate={handleNavigationClick}
								lessonsState={lessonsState}
								lessonOrder={new Date(lesson.createdAt).getTime()}
								isNavigating={isNavigating}
							/>
						</div>
					</div>
					<LessonPlayer
						lesson={lesson}
						progress={progress}
						handleVideoEnd={handleVideoEnd}
						handleProgressUpdate={handleProgressUpdate}
					/>
					<LessonComments lessonId={lesson.id} />
				</div>

				{/* Right Sidebar */}
				<div className="flex flex-col">
					<LessonActivities
						activities={activities} // Pass full array
						isVideoCompleted={isVideoCompleted}
						isActivityCompleted={isActivityCompleted}
						handleActivityCompletion={handleActivityCompletion}
						userId={userId}
						onLessonUnlocked={handleLessonUnlocked}
						courseId={lesson.courseId}
						lessonId={lesson.id} // Add this line
						isLastLesson={isLastLesson(lessonsState, lesson.id)}
						isLastActivity={isLastActivity(lessonsState, activities, lesson)}
						lessons={lessonsState} // Add this prop
					/>
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
