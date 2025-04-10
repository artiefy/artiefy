'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useProgress } from '@bprogress/next';
import { useUser } from '@clerk/nextjs';
import { formatInTimeZone } from 'date-fns-tz';
import { FaRobot } from 'react-icons/fa';
import { toast } from 'sonner';

import LessonActivities from '~/components/estudiantes/layout/lessondetail/LessonActivities';
import LessonBreadcrumbs from '~/components/estudiantes/layout/lessondetail/LessonBreadcrumbs';
import LessonCards from '~/components/estudiantes/layout/lessondetail/LessonCards';
import LessonChatBot from '~/components/estudiantes/layout/lessondetail/LessonChatbot';
import LessonComments from '~/components/estudiantes/layout/lessondetail/LessonComments';
import LessonNavigation from '~/components/estudiantes/layout/lessondetail/LessonNavigation';
import LessonPlayer from '~/components/estudiantes/layout/lessondetail/LessonPlayer';
import LessonResource from '~/components/estudiantes/layout/lessondetail/LessonResource';
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
import {
	saveScrollPosition,
	restoreScrollPosition,
} from '~/utils/scrollPosition';

const TIME_ZONE = 'America/Bogota';

interface LessonDetailsProps {
	lesson: LessonWithProgress;
	activities: Activity[]; // Change from activity to activities
	lessons: Lesson[];
	userLessonsProgress: UserLessonsProgress[];
	userActivitiesProgress: UserActivitiesProgress[];
	userId: string;
	course: Course;
}

export default function LessonDetails({
	lesson,
	activities, // Update prop name
	lessons,
	userLessonsProgress,
	userActivitiesProgress,
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
	const [lessonsState, setLessonsState] = useState<LessonWithProgress[]>([]);
	const searchParams = useSearchParams();
	const { start, stop } = useProgress();

	// Add isInitialized ref to prevent infinite loop
	const isInitialized = useRef(false);

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

	// Initialize lessons state with progress and locked status
	useEffect(() => {
		const initializeLessonsState = () => {
			const sortedLessons = [...lessons].sort((a, b) =>
				a.title.localeCompare(b.title, undefined, { numeric: true })
			);

			const lessonsWithProgress = sortedLessons.map((lessonItem, index) => {
				const progress = userLessonsProgress.find(
					(p) => p.lessonId === lessonItem.id
				);

				// Only first lesson is unlocked by default
				if (index === 0) {
					return {
						...lessonItem,
						isLocked: false,
						porcentajecompletado: progress?.progress ?? 0,
						isCompleted: progress?.isCompleted ?? false,
						isNew: progress?.isNew ?? true, // Agregar propiedad isNew
						courseTitle: lesson.courseTitle, // Add courseTitle property
					};
				}

				// Other lessons remain locked until explicitly unlocked via activity completion
				return {
					...lessonItem,
					isLocked: progress?.isLocked ?? true, // Use stored lock state or default to locked
					porcentajecompletado: progress?.progress ?? 0,
					isCompleted: progress?.isCompleted ?? false,
					isNew: progress?.isNew ?? true, // Agregar propiedad isNew
					courseTitle: lesson.courseTitle, // Add courseTitle property
				};
			});

			setLessonsState(lessonsWithProgress);
		};

		initializeLessonsState();
	}, [lessons, userLessonsProgress, lesson.courseTitle]);

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

	// Update this function to handle progress synchronization
	const handleProgressUpdate = async (videoProgress: number) => {
		const roundedProgress = Math.round(videoProgress);

		// Only update if progress has increased
		if (roundedProgress > progress && roundedProgress <= 100) {
			try {
				// Update local state immediately for smooth UI
				setProgress(roundedProgress);

				// Update database
				await updateLessonProgress(lesson.id, roundedProgress);

				// Update lessons state to reflect changes
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

				// If video reaches 100%, mark lesson as completed
				if (roundedProgress === 100) {
					setIsVideoCompleted(true);
					toast.success('Clase completada', {
						description: activities.length
							? 'Ahora completa la actividad para continuar'
							: 'Video completado exitosamente',
					});
				}
			} catch (error) {
				console.error('Error al actualizar el progreso:', error);
				toast.error('Error al sincronizar el progreso');

				// Revert local state if update fails
				setProgress(progress);
			}
		}
	};

	// Update video end handler to ensure 100% completion
	const handleVideoEnd = async () => {
		try {
			// Force progress to 100%
			await handleProgressUpdate(100);

			// Additional completion logic
			await handleLessonCompletion();
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

	// Add new effect to check subscription status with free course handling
	useEffect(() => {
		const checkSubscriptionStatus = () => {
			// If it's a free course, skip subscription check
			if (course.courseType?.requiredSubscriptionLevel === 'none') {
				return;
			}

			const subscriptionStatus = user?.publicMetadata?.subscriptionStatus;
			const rawSubscriptionEndDate = user?.publicMetadata
				?.subscriptionEndDate as string | null;

			const formattedSubscriptionEndDate = rawSubscriptionEndDate
				? formatInTimeZone(
						new Date(rawSubscriptionEndDate),
						TIME_ZONE,
						'yyyy-MM-dd HH:mm:ss'
					)
				: null;

			const isSubscriptionActive =
				subscriptionStatus === 'active' &&
				(!formattedSubscriptionEndDate ||
					new Date(formattedSubscriptionEndDate) > new Date());

			if (!isSubscriptionActive) {
				// Usar un ID único para el toast para evitar duplicados
				toast.error(
					'Debes tener una suscripción activa para poder ver las clases.',
					{
						id: 'subscription-required',
					}
				);
				void router.push('/planes');
			}
		};

		// Solo verificar una vez al cargar el componente
		checkSubscriptionStatus();
	}, [course.courseType?.requiredSubscriptionLevel, router, user]);

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
								isCompleted: !activities.length,
								// Don't modify isLocked status here
							}
						: l
				)
			);
		} catch (error) {
			console.error('Error:', error);
			toast.error('Error al completar la lección');
			throw error;
		}
	};

	// Add function to get next lesson ID
	const getNextLessonId = useCallback(() => {
		const sortedLessons = [...lessonsState].sort((a, b) =>
			a.title.localeCompare(b.title)
		);
		const currentIndex = sortedLessons.findIndex((l) => l.id === lesson.id);
		const nextLesson = sortedLessons[currentIndex + 1];
		return nextLesson && !nextLesson.isLocked ? nextLesson.id : undefined;
	}, [lessonsState, lesson.id]);

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

	const isLastLesson = useCallback(() => {
		const sortedLessons = [...lessonsState].sort((a, b) =>
			a.title.localeCompare(b.title)
		);
		const currentIndex = sortedLessons.findIndex((l) => l.id === lesson.id);
		return currentIndex === sortedLessons.length - 1;
	}, [lessonsState, lesson.id]);

	const isLastActivity = useCallback(() => {
		const lastLesson = lessons[lessons.length - 1];
		const isLastLesson = lesson.id === lastLesson.id;

		if (!isLastLesson) return false;

		const lastActivity = lesson.activities?.[lesson.activities.length - 1];
		return activities[0]?.id === lastActivity?.id;
	}, [lesson, activities, lessons]);

	useEffect(() => {
		if (!course.isActive) {
			toast.error('Curso no disponible', {
				description: 'Este curso no está disponible actualmente.',
			});
			router.push('/estudiantes');
		}
	}, [course.isActive, router]);

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
						isLastLesson={isLastLesson()}
						isLastActivity={isLastActivity()}
						resourceNames={lesson.resourceNames}
						getNextLessonId={getNextLessonId} // Add this prop
					/>
					<LessonResource resourceNames={lesson.resourceNames} />
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
