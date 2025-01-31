'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { StarIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import {
	FaCalendar,
	FaChevronDown,
	FaChevronUp,
	FaClock,
	FaHome,
	FaUserGraduate,
	FaCheck,
	FaLock,
	FaCheckCircle,
} from 'react-icons/fa';
import ChatbotModal from '~/components/estudiantes/layout/ChatbotModal';
import Comments from '~/components/estudiantes/layout/Comments';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Badge } from '~/components/estudiantes/ui/badge';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '~/components/estudiantes/ui/breadcrumb';
import { Button } from '~/components/estudiantes/ui/button';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from '~/components/estudiantes/ui/card';
import { Icons } from '~/components/estudiantes/ui/icons';
import { Progress } from '~/components/estudiantes/ui/progress';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';
import { useToast } from '~/hooks/use-toast';
import { blurDataURL } from '~/lib/blurDataUrl';
import { enrollInCourse } from '~/server/actions/courses/enrollInCourse';
import { getCourseById } from '~/server/actions/courses/getCourseById';
import { unenrollFromCourse } from '~/server/actions/courses/unenrollFromCourse';
import { getLessonsByCourseId } from '~/server/actions/lessons/getLessonsByCourseId';
import type { Course, Enrollment } from '~/types';

export default function CourseDetails({
	course: initialCourse,
}: {
	course: Course;
}) {
	const [course, setCourse] = useState<Course>(initialCourse);
	const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [isEnrolling, setIsEnrolling] = useState(false);
	const [isUnenrolling, setIsUnenrolling] = useState(false);
	const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
	const [totalStudents, setTotalStudents] = useState(course.totalStudents);
	const [isEnrolled, setIsEnrolled] = useState(false);
	const { isSignedIn, userId } = useAuth();
	const { toast } = useToast();

	useEffect(() => {
		const fetchUserProgress = async () => {
			if (userId && isEnrolled) {
				try {
					const lessons = await getLessonsByCourseId(course.id);
					setCourse((prevCourse) => ({
						...prevCourse,
						lessons: lessons.map((lesson) => ({
							...lesson,
							isLocked: lesson.userProgress === 0 && lesson.order !== 1,
							porcentajecompletado: lesson.userProgress,
						})),
					}));
				} catch (error) {
					console.error('Error fetching user progress:', error);
				}
			}
		};

		if (Array.isArray(course.enrollments) && userId) {
			const userEnrolled = course.enrollments.some(
				(enrollment: Enrollment) => enrollment.userId === userId
			);
			setIsEnrolled(userEnrolled);
			if (userEnrolled) {
				void fetchUserProgress();
			}
		}

		const timer = setTimeout(() => {
			setLoading(false);
		}, 1000);

		return () => clearTimeout(timer);
	}, [course.enrollments, userId, isEnrolled, course.id]);

	const toggleLesson = (lessonId: number) => {
		if (isEnrolled) {
			setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
		}
	};

	const formatDate = (dateString: string | number | Date) =>
		new Date(dateString).toISOString().split('T')[0];

	const handleEnroll = async () => {
		if (!isSignedIn) {
			toast({
				title: 'Debes iniciar sesión',
				description: 'Debes iniciar sesión para inscribirte en este curso.',
				variant: 'destructive',
			});
			return;
		}

		if (isEnrolling) {
			return;
		}

		setIsEnrolling(true);
		setEnrollmentError(null);

		try {
			const result = await enrollInCourse(course.id);
			if (result.success) {
				setTotalStudents((prevTotal) => prevTotal + 1);
				setIsEnrolled(true);
				const updatedCourse = await getCourseById(course.id);
				if (updatedCourse) {
					setCourse({
						...updatedCourse,
						lessons: updatedCourse.lessons ?? [],
					});
				}
				toast({
					title: 'Suscripción exitosa',
					description: '¡Te has Inscrito exitosamente en el curso!',
					variant: 'default',
				});
			} else {
				throw new Error(result.message);
			}
		} catch (error: unknown) {
			handleError(error, 'Error de Suscripción', 'Error al inscribirse');
		} finally {
			setIsEnrolling(false);
		}
	};

	const handleUnenroll = async () => {
		if (!isSignedIn || isUnenrolling) {
			return;
		}

		setIsUnenrolling(true);
		setEnrollmentError(null);

		try {
			await unenrollFromCourse(course.id);
			setTotalStudents((prevTotal) => prevTotal - 1);
			setIsEnrolled(false);
			const updatedCourse = await getCourseById(course.id);
			if (updatedCourse) {
				setCourse({
					...updatedCourse,
					lessons: updatedCourse.lessons ?? [],
				});
			}
			toast({
				title: 'Cancelar Suscripción',
				description: 'Se Canceló El Curso Correctamente',
				variant: 'default',
			});
		} catch (error: unknown) {
			handleError(error, 'Error de desuscripción', 'Error al desuscribirse');
		} finally {
			setIsUnenrolling(false);
		}
	};

	const handleError = (
		error: unknown,
		toastTitle: string,
		toastDescription: string
	) => {
		if (error instanceof Error) {
			setEnrollmentError(error.message);
			toast({
				title: toastTitle,
				description: `${toastDescription}: ${error.message}`,
				variant: 'destructive',
			});
		} else {
			setEnrollmentError('Error desconocido');
			toast({
				title: toastTitle,
				description: 'Error desconocido',
				variant: 'destructive',
			});
		}
		console.error(toastDescription, error);
	};

	const sortedLessons = [...course.lessons].sort((a, b) => a.order - b.order);

	return (
		<div className="bg-background min-h-screen">
			<Header />
			<main className="mx-auto max-w-7xl pb-4 md:pb-6 lg:pb-8">
				<Breadcrumb className="pb-6">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/">
								<FaHome className="mr-1 inline-block" /> Inicio
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href="/estudiantes">
								<FaUserGraduate className="mr-1 inline-block" /> Cursos
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{course.title}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				{loading ? (
					<Skeleton className="h-[500px] w-full rounded-lg" />
				) : (
					<Card className="overflow-hidden">
						<CardHeader className="p-0">
							<AspectRatio ratio={16 / 6}>
								<Image
									src={
										course.coverImageKey
											? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`.trimEnd()
											: 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
									}
									alt={course.title}
									fill
									className="object-cover"
									priority
									sizes="100vw"
									placeholder="blur"
									blurDataURL={blurDataURL}
									onError={(e) => {
										e.currentTarget.src = '/fetch-error.jpg';
									}}
								/>
								<div className="bg-linear-to-t absolute inset-x-0 bottom-0 from-black/70 to-transparent p-6">
									<h1 className="text-3xl font-bold text-white">
										{course.title}
									</h1>
								</div>
							</AspectRatio>
						</CardHeader>
						<CardContent className="space-y-6 p-6">
							<div className="flex flex-wrap items-center justify-between gap-4">
								<div>
									<h3 className="text-background text-lg font-semibold">
										{course.instructor}
									</h3>
									<p className="text-gray-600">Educador</p>
								</div>
								<div className="flex items-center space-x-6">
									<div className="flex items-center">
										<FaUserGraduate className="mr-2 text-blue-600" />
										<span className="text-background">
											{totalStudents} Estudiantes
										</span>
									</div>
									<div className="flex items-center">
										{Array.from({ length: 5 }).map((_, index) => (
											<StarIcon
												key={index}
												className={`size-5 ${index < Math.floor(course.rating ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`}
											/>
										))}
										<span className="ml-2 text-lg font-semibold text-yellow-400">
											{course.rating?.toFixed(1)}
										</span>
									</div>
								</div>
							</div>
							<div className="flex flex-wrap items-center justify-between gap-4">
								<div className="flex items-center space-x-4">
									<Badge
										variant="outline"
										className="border-primary bg-background text-primary hover:bg-black/70"
									>
										{course.category?.name}
									</Badge>
									<div className="flex items-center">
										<FaCalendar className="mr-2 text-gray-600" />
										<span className="text-sm text-gray-600">
											Creado: {formatDate(course.createdAt)}
										</span>
									</div>
									<div className="flex items-center">
										<FaClock className="mr-2 text-gray-600" />
										<span className="text-sm text-gray-600">
											Última actualización: {formatDate(course.updatedAt)}
										</span>
									</div>
								</div>
								<Badge className="bg-red-500 text-white hover:bg-red-700">
									{course.modalidad?.name}
								</Badge>
							</div>

							<div className="prose max-w-none">
								<p className="leading-relaxed text-gray-700">
									{course.description ?? 'No hay descripción disponible.'}
								</p>
							</div>

							<div>
								<h2 className="text-background mb-4 text-2xl font-bold">
									Contenido del curso
								</h2>
								<div className="space-y-4">
									{sortedLessons.map((lesson) => {
										const isUnlocked = isEnrolled && !lesson.isLocked;

										return (
											<div
												key={lesson.id}
												className={`overflow-hidden rounded-lg border transition-colors ${
													isUnlocked
														? 'bg-gray-50 hover:bg-gray-100'
														: 'bg-gray-100 opacity-75'
												}`}
											>
												<button
													className="flex w-full items-center justify-between px-6 py-4"
													onClick={() => toggleLesson(lesson.id)}
													disabled={!isUnlocked}
												>
													<div className="flex w-full items-center justify-between">
														<div className="flex items-center space-x-2">
															{isUnlocked ? (
																<FaCheckCircle className="mr-2 size-5 text-green-500" />
															) : (
																<FaLock className="mr-2 size-5 text-gray-400" />
															)}
															<span className="text-background font-medium">
																Clase {lesson.order}: {lesson.title}{' '}
																<span className="ml-2 text-sm text-gray-500">
																	({lesson.duration} mins)
																</span>
															</span>
														</div>
														<div className="flex items-center space-x-2">
															{isUnlocked &&
																(expandedLesson === lesson.id ? (
																	<FaChevronUp className="text-gray-400" />
																) : (
																	<FaChevronDown className="text-gray-400" />
																))}
														</div>
													</div>
												</button>
												{expandedLesson === lesson.id && isUnlocked && (
													<div className="border-t bg-white px-6 py-4">
														<p className="mb-4 text-gray-700">
															{lesson.description ??
																'No hay descripción disponible para esta clase.'}
														</p>
														<div className="mb-4">
															<div className="mb-2 flex items-center justify-between">
																<p className="text-sm font-semibold text-gray-700">
																	Progreso De La Clase:
																</p>
																<span className="text-sm font-medium text-gray-600">
																	{lesson.porcentajecompletado}%
																</span>
															</div>
															<Progress
																value={lesson.porcentajecompletado}
																className="w-full bg-gray-200"
																style={
																	{
																		'--progress-background': 'green',
																	} as React.CSSProperties
																}
															/>
														</div>
														<Button
															asChild
															className="text-background mt-4 hover:underline active:scale-95"
														>
															<Link href={`/estudiantes/clases/${lesson.id}`}>
																Ver Clase
															</Link>
														</Button>
													</div>
												)}
											</div>
										);
									})}
								</div>
							</div>
						</CardContent>
						<CardFooter className="flex flex-col items-center justify-between space-y-4">
							<div
								className={`transition-opacity duration-500 ${isEnrolled ? 'opacity-0' : 'opacity-100'}`}
							>
								{!isEnrolled && (
									<div className="group relative">
										<Button
											onClick={handleEnroll}
											disabled={isEnrolling}
											className="relative inline-block h-12 w-64 cursor-pointer rounded-xl bg-gray-800 p-px font-semibold leading-6 text-white shadow-2xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 disabled:opacity-50"
										>
											<span className="bg-linear-to-r absolute inset-0 rounded-xl from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>

											<span className="relative z-10 block rounded-xl bg-gray-950 px-6 py-3">
												<div className="relative z-10 flex items-center justify-center space-x-2">
													{isEnrolling ? (
														<Icons.spinner
															className="animate-spin text-white"
															style={{ width: '25px', height: '25px' }}
														/>
													) : (
														<>
															<span className="transition-all duration-500 group-hover:translate-x-1">
																Inscribirse al curso
															</span>
															<svg
																className="size-6 transition-transform duration-500 group-hover:translate-x-1"
																data-slot="icon"
																aria-hidden="true"
																fill="currentColor"
																viewBox="0 0 20 20"
																xmlns="http://www.w3.org/2000/svg"
															>
																<path
																	clipRule="evenodd"
																	d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
																	fillRule="evenodd"
																></path>
															</svg>
														</>
													)}
												</div>
											</span>
										</Button>
									</div>
								)}
							</div>
							<div
								className={`transition-opacity duration-500 ${isEnrolled ? 'opacity-100' : 'opacity-0'}`}
							>
								{isEnrolled && (
									<div className="flex w-full flex-col space-y-4 sm:w-auto">
										<Button
											className="bg-primary text-background hover:bg-primary/90 h-12 w-64 justify-center border-white/20 text-lg font-semibold transition-colors active:scale-95"
											disabled={true}
										>
											<FaCheck className="mr-2" /> Suscrito Al Curso
										</Button>
										<Button
											className="h-12 w-64 justify-center border-white/20 bg-red-500 text-lg font-semibold hover:bg-red-600"
											onClick={handleUnenroll}
											disabled={isUnenrolling}
										>
											{isUnenrolling ? (
												<Icons.spinner
													className="animate-spin text-white"
													style={{ width: '25px', height: '25px' }}
												/>
											) : (
												'Cancelar Suscripción'
											)}
										</Button>
									</div>
								)}
							</div>
							<ChatbotModal />
						</CardFooter>
					</Card>
				)}
				{enrollmentError && (
					<div className="mt-4 rounded-md bg-red-50 p-4">
						<div className="flex">
							<div className="ml-3">
								<h3 className="text-sm font-medium text-red-800">
									Error de {isEnrolled ? 'desuscripción' : 'suscripción'}
								</h3>
								<div className="mt-2 text-sm text-red-700">
									<p>{enrollmentError}</p>
								</div>
							</div>
						</div>
					</div>
				)}
				{/* Añadir el componente de comentarios aquí */}
				<Comments courseId={course.id} />
			</main>
			<Footer />
		</div>
	);
}
