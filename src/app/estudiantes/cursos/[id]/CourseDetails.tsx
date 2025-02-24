'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { StarIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import NProgress from 'nprogress';
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
import { enrollInCourse } from '~/server/actions/estudiantes/courses/enrollInCourse';
import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';
import { unenrollFromCourse } from '~/server/actions/estudiantes/courses/unenrollFromCourse';
import { getLessonsByCourseId } from '~/server/actions/estudiantes/lessons/getLessonsByCourseId';
import type { Course, Enrollment } from '~/types';
import '~/styles/buttonclass.css';

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
	const { user } = useUser();
	const { toast } = useToast();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		const fetchUserProgress = async () => {
			if (userId && isEnrolled && !loading) {
				try {
					const lessons = await getLessonsByCourseId(course.id);
					setCourse((prevCourse) => ({
						...prevCourse,
						lessons: lessons
							.map((lesson, index) => ({
								...lesson,
								isLocked: lesson.userProgress === 0 && index !== 0,
								porcentajecompletado: lesson.userProgress,
							}))
							.sort((a, b) => a.title.localeCompare(b.title)), // Ordenar por título
					}));
				} catch (error) {
					console.error('Error fetching user progress:', error);
				}
			}
		};

		// Evitar actualizar el estado innecesariamente
		setIsEnrolled((prevIsEnrolled) => {
			const userEnrolled =
				Array.isArray(course.enrollments) && userId
					? course.enrollments.some(
							(enrollment: Enrollment) => enrollment.userId === userId
						)
					: false;

			return prevIsEnrolled !== userEnrolled ? userEnrolled : prevIsEnrolled;
		});

		if (isEnrolled) {
			void fetchUserProgress();
		}

		const timer = setTimeout(() => {
			setLoading(false);
		}, 1000);

		return () => clearTimeout(timer);
	}, [course.enrollments, userId, course.id, isEnrolled, loading]);

	const toggleLesson = (lessonId: number) => {
		if (isEnrolled) {
			setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
		}
	};

	const formatDate = (dateString: string | number | Date) =>
		new Date(dateString).toISOString().split('T')[0];

	useEffect(() => {
		const checkSubscriptionStatus = () => {
			if (userId) {
				const userSubscriptionStatus = user?.publicMetadata?.subscriptionStatus;
				console.log(
					'Estado de suscripción detectado en frontend:',
					userSubscriptionStatus
				);
				if (userSubscriptionStatus === 'active') {
					setIsEnrolled(true);
				}
			}
		};

		void checkSubscriptionStatus();
	}, [userId, user]);

	const handleEnroll = async () => {
		if (!isSignedIn) {
			toast({
				title: 'Debes iniciar sesión',
				description: 'Debes iniciar sesión para inscribirte en este curso.',
				variant: 'destructive',
			});
			void router.push(`/sign-in?redirect_url=${pathname}`);
			return;
		}

		if (isEnrolling) {
			return; // Evitar múltiples llamadas
		}

		setIsEnrolling(true);
		setEnrollmentError(null);

		try {
			if (
				!user?.publicMetadata?.subscriptionStatus ||
				user.publicMetadata.subscriptionStatus !== 'active'
			) {
				toast({
					title: 'Suscripción requerida',
					description:
						'Debes tener una suscripción activa para inscribirte en este curso.',
					variant: 'destructive',
				});
				setIsEnrolling(false);
				void router.push('/planes');
				return;
			}

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
			return; // Evitar múltiples llamadas
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

	return (
		<div className="min-h-screen bg-background">
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
								/>
								<div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-6">
									<h1 className="text-3xl font-bold text-white">
										{course.title}
									</h1>
								</div>
							</AspectRatio>
						</CardHeader>
						<CardContent className="space-y-6 p-6">
							<div className="flex flex-wrap items-center justify-between gap-4">
								<div>
									<h3 className="text-lg font-semibold text-background">
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
								<h2 className="mb-4 text-2xl font-bold text-background">
									Contenido del curso
								</h2>
								<div className="space-y-4">
									{course.lessons
										.sort((a, b) => a.title.localeCompare(b.title)) // Ordenar por título
										.map((lesson, index) => {
											const isUnlocked = isEnrolled && !lesson.isLocked;

											const handleClick = (
												e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
											) => {
												e.preventDefault();
												NProgress.start();
												router.push(`/estudiantes/clases/${lesson.id}`);
											};

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
																<span className="font-medium text-background">
																	Clase {index + 1}: {lesson.title}{' '}
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
															<Link
																href={`/estudiantes/clases/${lesson.id}`}
																onClick={handleClick}
															>
																<button className="buttonclass text-background active:scale-95">
																	<div className="outline"></div>
																	<div className="state state--default">
																		<div className="icon">
																			<svg
																				xmlns="http://www.w3.org/2000/svg"
																				fill="none"
																				viewBox="0 0 24 24"
																				height="1.2em"
																				width="1.2em"
																			>
																				<g style={{ filter: 'url(#shadow)' }}>
																					<path
																						fill="currentColor"
																						d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z"
																					></path>
																					<path
																						fill="currentColor"
																						d="M10.11 14.4C9.92005 14.4 9.73005 14.33 9.58005 14.18C9.29005 13.89 9.29005 13.41 9.58005 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z"
																					></path>
																				</g>
																				<defs>
																					<filter id="shadow">
																						<feDropShadow
																							floodOpacity="0.6"
																							stdDeviation="0.8"
																							dy="1"
																							dx="0"
																						></feDropShadow>
																					</filter>
																				</defs>
																			</svg>
																		</div>
																		<p>
																			<span
																				style={
																					{ '--i': 0 } as React.CSSProperties
																				}
																			>
																				V
																			</span>
																			<span
																				style={
																					{ '--i': 1 } as React.CSSProperties
																				}
																			>
																				e
																			</span>
																			<span
																				style={
																					{ '--i': 2 } as React.CSSProperties
																				}
																			>
																				r
																			</span>
																			<span
																				style={
																					{ '--i': 3 } as React.CSSProperties
																				}
																			>
																				{' '}
																			</span>
																			<span
																				style={
																					{ '--i': 4 } as React.CSSProperties
																				}
																			>
																				C
																			</span>
																			<span
																				style={
																					{ '--i': 5 } as React.CSSProperties
																				}
																			>
																				l
																			</span>
																			<span
																				style={
																					{ '--i': 6 } as React.CSSProperties
																				}
																			>
																				a
																			</span>
																			<span
																				style={
																					{ '--i': 7 } as React.CSSProperties
																				}
																			>
																				s
																			</span>
																			<span
																				style={
																					{ '--i': 8 } as React.CSSProperties
																				}
																			>
																				e
																			</span>
																		</p>
																	</div>
																	<div className="state state--sent">
																		<div className="icon">
																			<svg
																				stroke="black"
																				strokeWidth="0.5px"
																				width="1.2em"
																				height="1.2em"
																				viewBox="0 0 24 24"
																				fill="none"
																				xmlns="http://www.w3.org/2000/svg"
																			>
																				<g style={{ filter: 'url(#shadow)' }}>
																					<path
																						d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75ZM12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75Z"
																						fill="currentColor"
																					></path>
																					<path
																						d="M10.5795 15.5801C10.3795 15.5801 10.1895 15.5001 10.0495 15.3601L7.21945 12.5301C6.92945 12.2401 6.92945 11.7601 7.21945 11.4701C7.50945 11.1801 7.98945 11.1801 8.27945 11.4701L10.5795 13.7701L15.7195 8.6301C16.0095 8.3401 16.4895 8.3401 16.7795 8.6301C17.0695 8.9201 17.0695 9.4001 16.7795 9.6901L11.1095 15.3601C10.9695 15.5001 10.7795 15.5801 10.5795 15.5801Z"
																						fill="currentColor"
																					></path>
																				</g>
																			</svg>
																		</div>
																		<p>
																			<span
																				style={
																					{ '--i': 5 } as React.CSSProperties
																				}
																			>
																				V
																			</span>
																			<span
																				style={
																					{ '--i': 6 } as React.CSSProperties
																				}
																			>
																				i
																			</span>
																			<span
																				style={
																					{ '--i': 7 } as React.CSSProperties
																				}
																			>
																				s
																			</span>
																			<span
																				style={
																					{ '--i': 8 } as React.CSSProperties
																				}
																			>
																				t
																			</span>
																			<span
																				style={
																					{ '--i': 9 } as React.CSSProperties
																				}
																			>
																				o
																			</span>
																			<span
																				style={
																					{ '--i': 10 } as React.CSSProperties
																				}
																			>
																				!
																			</span>
																		</p>
																	</div>
																</button>
															</Link>
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
								className={`transition-opacity duration-500 ${isEnrolled ? 'opacity-100' : 'opacity-0'}`}
							>
								{isEnrolled && (
									<div className="flex w-full flex-col space-y-4 sm:w-auto">
										<Button
											className="h-12 w-64 justify-center border-white/20 bg-primary text-lg font-semibold text-background transition-colors hover:bg-primary/90 active:scale-95"
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
							<div
								className={`transition-opacity duration-500 ${!isEnrolled ? 'opacity-100' : 'opacity-0'}`}
							>
								{!isEnrolled && (
									<div className="group relative">
										<Button
											onClick={handleEnroll}
											disabled={isEnrolling}
											className="relative inline-block h-12 w-64 cursor-pointer rounded-xl bg-gray-800 p-px leading-6 font-semibold text-white shadow-2xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 disabled:opacity-50"
										>
											<span className="absolute inset-0 rounded-xl bg-linear-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>
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
