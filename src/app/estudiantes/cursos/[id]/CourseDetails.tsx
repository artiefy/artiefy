'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { CourseBreadcrumb } from '~/components/estudiantes/layout/coursedetail/CourseBreadcrumb';
import CourseChatbot from '~/components/estudiantes/layout/coursedetail/CourseChatbot';
import CourseComments from '~/components/estudiantes/layout/coursedetail/CourseComments';
import { CourseHeader } from '~/components/estudiantes/layout/coursedetail/CourseHeader';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';
import { useToast } from '~/hooks/use-toast';
import { enrollInCourse } from '~/server/actions/estudiantes/courses/enrollInCourse';
import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';
import { unenrollFromCourse } from '~/server/actions/estudiantes/courses/unenrollFromCourse';
import { getLessonsByCourseId } from '~/server/actions/estudiantes/lessons/getLessonsByCourseId';
import type { Course, Enrollment } from '~/types';

export default function CourseDetails({
	course: initialCourse,
}: {
	course: Course;
}) {
	const [course, setCourse] = useState<Course>(initialCourse);
	const [loading, setLoading] = useState(true);
	const [isEnrolling, setIsEnrolling] = useState(false);
	const [isUnenrolling, setIsUnenrolling] = useState(false);
	const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
	const [totalStudents, setTotalStudents] = useState(course.totalStudents);
	const [isEnrolled, setIsEnrolled] = useState(false);
	const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);

	const { isSignedIn, userId } = useAuth();
	const { user } = useUser();
	const { toast } = useToast();
	const router = useRouter();
	const pathname = usePathname();

	const errorMessages = {
		enrollment: {
			title: 'Error de inscripción',
			description: 'No se pudo completar la inscripción',
		},
		unenrollment: {
			title: 'Error al cancelar inscripción',
			description: 'No se pudo cancelar la inscripción',
		},
	} as const;

	useEffect(() => {
		const checkEnrollmentAndProgress = async () => {
			if (userId) {
				// Verificar inscripción
				const isUserEnrolled =
					Array.isArray(course.enrollments) &&
					course.enrollments.some(
						(enrollment: Enrollment) => enrollment.userId === userId
					);
				setIsEnrolled(isUserEnrolled);

				// Verificar estado de suscripción
				const userSubscriptionStatus = user?.publicMetadata?.subscriptionStatus;
				const subscriptionEndDate = user?.publicMetadata
					?.subscriptionEndDate as string;
				const isActive =
					userSubscriptionStatus === 'active' &&
					(!subscriptionEndDate || new Date(subscriptionEndDate) > new Date());

				setIsSubscriptionActive(isActive);

				if (isUserEnrolled && !loading) {
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
								.sort((a, b) => a.title.localeCompare(b.title)),
						}));
					} catch (error) {
						console.error('Error fetching user progress:', error);
						toast({
							title: 'Error',
							description: 'No se pudo cargar el progreso de las lecciones',
							variant: 'destructive',
						});
					}
				}
			}
		};

		void checkEnrollmentAndProgress();

		const timer = setTimeout(() => setLoading(false), 1000);
		return () => clearTimeout(timer);
	}, [
		course.enrollments,
		course.id,
		userId,
		isEnrolled,
		loading,
		user,
		router,
		toast,
	]);

	const handleEnroll = async () => {
		if (!isSignedIn) {
			toast({
				title: 'Acceso Requerido',
				description: 'Debes iniciar sesión para inscribirte en este curso.',
				variant: 'destructive',
			});
			void router.push(`/sign-in?redirect_url=${pathname}`);
			return;
		}

		if (isEnrolling) return;

		setIsEnrolling(true);
		setEnrollmentError(null);

		// Check subscription status
		const userSubscriptionStatus = user?.publicMetadata?.subscriptionStatus;
		const subscriptionEndDate = user?.publicMetadata
			?.subscriptionEndDate as string;
		const isActive =
			userSubscriptionStatus === 'active' &&
			(!subscriptionEndDate || new Date(subscriptionEndDate) > new Date());

		if (!isActive) {
			toast({
				title: 'Suscripción requerida',
				description:
					'Necesitas una suscripción activa para acceder a este curso.',
				variant: 'destructive',
			});
			setIsEnrolling(false);
			void router.push('/planes');
			return;
		}

		try {
			const result = await enrollInCourse(course.id);

			if (result.success) {
				setTotalStudents((prev) => prev + 1);
				setIsEnrolled(true);
				const updatedCourse = await getCourseById(course.id);
				if (updatedCourse) {
					setCourse({
						...updatedCourse,
						lessons: updatedCourse.lessons ?? [],
					});
				}
				toast({
					title: '¡Inscripción exitosa!',
					description: 'Te has inscrito correctamente al curso.',
					variant: 'default',
				});
			} else {
				throw new Error(result.message);
			}
		} catch (error: unknown) {
			handleError(error, 'enrollment');
		} finally {
			setIsEnrolling(false);
		}
	};

	const handleUnenroll = async () => {
		if (!isSignedIn || isUnenrolling) return;

		setIsUnenrolling(true);
		setEnrollmentError(null);

		try {
			await unenrollFromCourse(course.id);
			setTotalStudents((prev) => prev - 1);
			setIsEnrolled(false);
			const updatedCourse = await getCourseById(course.id);
			if (updatedCourse) {
				setCourse({
					...updatedCourse,
					lessons: updatedCourse.lessons ?? [],
				});
			}
			toast({
				title: 'Cancelar Inscripción',
				description: 'Has cancelado tu inscripción al curso correctamente',
				variant: 'default',
			});
		} catch (error: unknown) {
			handleError(error, 'unenrollment');
		} finally {
			setIsUnenrolling(false);
		}
	};

	const handleError = (
		error: unknown,
		errorType: keyof typeof errorMessages
	) => {
		const message = errorMessages[errorType];
		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido';

		setEnrollmentError(errorMessage);
		toast({
			title: message.title,
			description: `${message.description}: ${errorMessage}`,
			variant: 'destructive',
		});
		console.error(`${message.title}:`, error);
	};

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="mx-auto max-w-7xl pb-4 md:pb-6 lg:pb-8">
				<CourseBreadcrumb title={course.title} />

				{loading ? (
					<Skeleton className="h-[500px] w-full rounded-lg" />
				) : (
					<>
						<CourseHeader
							course={course}
							totalStudents={totalStudents}
							isEnrolled={isEnrolled}
							isEnrolling={isEnrolling}
							isUnenrolling={isUnenrolling}
							isSubscriptionActive={isSubscriptionActive}
							onEnroll={handleEnroll}
							onUnenroll={handleUnenroll}
						/>

						{isEnrolled && (
							<>
								{enrollmentError && (
									<div className="mt-4 rounded-md bg-red-50 p-4">
										<div className="flex">
											<div className="ml-3">
												<h3 className="text-sm font-medium text-red-800">
													Error de {isEnrolled ? 'cancelación' : 'inscripción'}
												</h3>
												<div className="mt-2 text-sm text-red-700">
													<p>{enrollmentError}</p>
												</div>
											</div>
										</div>
									</div>
								)}
								<CourseComments courseId={course.id} />
								<CourseChatbot />
							</>
						)}
					</>
				)}
			</main>
			<Footer />
		</div>
	);
}
