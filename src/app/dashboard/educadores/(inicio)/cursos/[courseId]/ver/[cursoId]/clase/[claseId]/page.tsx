'use client';

import { useState, useEffect } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import {
	FaCheckCircle,
	FaLock,
	FaClock,
	FaRobot,
	FaArrowLeft,
	FaArrowRight,
} from 'react-icons/fa';

import ChatBot from '~/components/estudiantes/layout/ChatBot';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import VideoPlayer from '~/components/estudiantes/layout/VideoPlayer';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import { Progress } from '~/components/estudiantes/ui/progress';
import { useToast } from '~/hooks/use-toast';
import { unlockNextLesson } from '~/server/actions/lessons/unlockNextLesson';
import { completeActivity } from '~/server/actions/progress/completeActivity';
import { updateLessonProgress } from '~/server/actions/progress/updateLessonProgress';
import { type Activity, type UserLessonsProgress } from '~/types';

interface Lesson {
	id: number;
	title: string;
	coverVideoKey: string;
	description: string | null;
	resourceKey: string;
	porcentajecompletado: number;
	duration: number;
	isCompleted: boolean;
	order: number;
}

interface Course {
	id: number;
	instructor: string;
}

interface LessonWithProgress extends Lesson {
	isLocked: boolean;
}

export default function LessonDetails({
	lesson,
	activity,
	course,
	lessons,
	userLessonsProgress,
}: {
	lesson: LessonWithProgress;
	activity: Activity | null;
	lessons: Lesson[];
	course: Course;
	userLessonsProgress: UserLessonsProgress[];
}) {
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
					};
				})
				.sort((a, b) => a.order - b.order); // Ensure lessons are sorted by order
			setLessonsState(lessonsWithProgress);
		};

		initializeLessonsState();
	}, [lessons, userLessonsProgress]);

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
							isCompleted: l.porcentajecompletado === 100, // Set completion status based on percentage
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

			// Solo desbloqueamos la siguiente lección si no hay actividad
			if (!activity) {
				const result = await unlockNextLesson(lesson.id);
				if (result.success && 'nextLessonId' in result) {
					toast({
						title: 'Clase Completada',
						description: '¡Avanzando a la siguiente clase!',
						variant: 'default',
					});

					// Navegación automática a la siguiente clase
					setTimeout(() => {
						setProgress(0);
						setSelectedLessonId(result.nextLessonId ?? null); // Handle undefined case
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
				toast({
					title: 'Clase Completada',
					description: '¡Avanzando a la siguiente clase!',
					variant: 'default',
				});

				// Navegación automática a la siguiente clase
				setTimeout(() => {
					setProgress(0);
					setSelectedLessonId(result.nextLessonId ?? null); // Handle undefined case
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
						? false // First lesson always unlocked
						: l.id === lesson.id
							? false // Current lesson in URL unlocked
							: l.porcentajecompletado > 0
								? false // Lessons with progress unlocked
								: l.isCompleted
									? false // Completed lessons unlocked
									: l.isLocked, // Keep original lock state for others
			}))
		);
	}, [lesson.id]);

	// Actualizar la lógica de renderizado de tarjetas
	const renderLessonCard = (lessonItem: LessonWithProgress) => {
		const isCurrentLesson = lessonItem.id === lesson.id;
		const isAccessible = !lessonItem.isLocked;
		const isCompleted =
			lessonItem.porcentajecompletado === 100 && lessonItem.isCompleted;

		return (
			<div
				key={lessonItem.id}
				onClick={() => {
					if (isAccessible) {
						setProgress(0);
						setSelectedLessonId(lessonItem.id);
						router.push(`/estudiantes/clases/${lessonItem.id}`);
					} else {
						toast({
							title: 'Clase Bloqueada',
							description: 'Debes completar las clases anteriores primero.',
							variant: 'destructive',
						});
					}
				}}
				className={`mb-2 rounded-lg p-4 transition-all ${isAccessible ? 'cursor-pointer hover:bg-blue-50' : 'cursor-not-allowed opacity-75'} ${isCurrentLesson ? 'border-l-8 border-blue-500 bg-blue-50' : 'bg-gray-50'} ${isCompleted ? 'border-green-500' : ''} `}
			>
				<div className="mb-2 flex items-center justify-between">
					<h3
						className={`font-semibold ${
							isAccessible ? 'text-gray-900' : 'text-gray-500'
						}`}
					>
						Clase {lessonItem.order}: {lessonItem.title}
					</h3>
					{isCompleted ? (
						<FaCheckCircle className="text-green-500" />
					) : lessonItem.isLocked ? (
						<FaLock className="text-gray-400" />
					) : (
						<FaClock className="text-gray-400" />
					)}
				</div>
				<p className="mb-2 text-sm text-gray-600">{course.instructor}</p>
				<div className="relative h-2 rounded bg-gray-200">
					<div
						className="absolute h-2 rounded bg-blue-500"
						style={{ width: `${lessonItem.porcentajecompletado}%` }}
					/>
				</div>
				<div className="mt-2 flex justify-between text-xs text-gray-500">
					<span>{lessonItem.duration} mins</span>
					<span>{lessonItem.porcentajecompletado}%</span>
				</div>
			</div>
		);
	};

	// Add this function to handle navigation
	const handleNavigation = (direction: 'prev' | 'next') => {
		const sortedLessons = [...lessonsState].sort((a, b) => a.order - b.order);
		const currentIndex = sortedLessons.findIndex(
			(l) => l.id === selectedLessonId
		);

		if (direction === 'prev') {
			// Buscar la lección anterior más cercana que esté desbloqueada
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
			// Buscar la siguiente lección que esté desbloqueada
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
						{lessonsState
							.sort((a, b) => a.order - b.order)
							.map(renderLessonCard)}
					</div>

					{/* Main Content */}
					<div className="flex-1 p-6">
						<div className="mx-auto max-w-4xl">
							{/* Navigation Buttons */}
							<div className="mb-4 flex justify-between">
								<Button
									onClick={() => handleNavigation('prev')}
									disabled={
										!lessonsState.some(
											(l, i) => i < lesson.order - 1 && !l.isLocked
										)
									}
									className="flex items-center gap-2 active:scale-95"
									variant="outline"
								>
									<FaArrowLeft /> Lección Anterior
								</Button>
								<Button
									onClick={() => handleNavigation('next')}
									disabled={
										!lessonsState.some(
											(l, i) => i > lesson.order - 1 && !l.isLocked
										)
									}
									className="flex items-center gap-2 active:scale-95"
									variant="outline"
								>
									Siguiente Lección <FaArrowRight />
								</Button>
							</div>

							{/* Video Player */}
							<div className="relative mb-6 aspect-video overflow-hidden rounded-lg bg-black">
								<VideoPlayer
									videoKey={lesson.coverVideoKey}
									onVideoEnd={handleVideoEnd}
									onProgressUpdate={handleProgressUpdate}
									isVideoCompleted={isVideoCompleted}
								/>
							</div>

							{/* Class Info */}
							<div className="rounded-lg bg-white p-6 shadow-sm">
								<h1 className="mb-4 text-2xl font-bold text-gray-900">
									{lesson.title}
								</h1>
								<p className="text-gray-600">{lesson.description}</p>
								<div className="mt-4">
									<div className="mb-2 flex items-center justify-between">
										<span className="text-gray-700">Progreso de la clase</span>
										<span className="text-gray-600">{progress}%</span>
									</div>
									<Progress value={progress} className="h-2" />
								</div>
							</div>
						</div>
					</div>

					{/* Right Sidebar - Activities */}
					<div className="w-72 bg-background p-4 shadow-lg">
						<h2 className="mb-4 text-2xl font-bold text-primary">
							Actividades
						</h2>
						{activity ? (
							<div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="font-semibold text-gray-900">
											{activity.name}
										</h3>
									</div>
									{isActivityCompleted ? (
										<FaCheckCircle className="text-green-500" />
									) : (
										<FaLock className="text-gray-400" />
									)}
								</div>
								<p className="mt-2 text-sm text-gray-600">
									{activity.description}
								</p>
								<Button
									onClick={handleActivityCompletion}
									disabled={
										!isVideoCompleted ||
										isActivityCompleted ||
										isCompletingActivity
									}
									className={`mt-4 w-full ${
										isVideoCompleted
											? 'bg-[#00BDD8] text-white hover:bg-[#00A5C0]'
											: 'bg-gray-400 text-background'
									}`}
								>
									{isCompletingActivity ? (
										<Icons.spinner className="mr-2 text-background" />
									) : isActivityCompleted ? (
										'Actividad Completada'
									) : isVideoCompleted ? (
										'Completar Actividad'
									) : (
										'Ver video primero'
									)}
								</Button>
							</div>
						) : (
							<p className="text-gray-600">No hay actividades disponibles</p>
						)}
					</div>

					{/* Chatbot Button and Modal */}
					<button
						onClick={() => setIsChatOpen(!isChatOpen)}
						className="fixed bottom-6 right-6 rounded-full bg-blue-500 p-4 text-white shadow-lg transition-colors hover:bg-blue-600"
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
