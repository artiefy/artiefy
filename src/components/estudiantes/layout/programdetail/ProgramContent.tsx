'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@clerk/nextjs';
import {
	StarIcon,
	ArrowRightCircleIcon,
	CheckCircleIcon,
} from '@heroicons/react/24/solid';
import { FaCrown, FaCheck } from 'react-icons/fa';

import {
	Alert,
	AlertTitle,
	AlertDescription,
} from '~/components/estudiantes/ui/alert';
import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Badge } from '~/components/estudiantes/ui/badge';
import { Button } from '~/components/estudiantes/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/estudiantes/ui/card';
import { Icons } from '~/components/estudiantes/ui/icons';
import { isUserEnrolled } from '~/server/actions/estudiantes/courses/enrollInCourse';

import type { Program, MateriaWithCourse, Course } from '~/types';

interface ProgramContentProps {
	program: Program;
	isEnrolled: boolean;
	isSubscriptionActive: boolean;
	subscriptionEndDate: string | null;
	isCheckingEnrollment: boolean; // Add this prop
}

export function ProgramContent({
	program,
	isEnrolled,
	isSubscriptionActive,
	subscriptionEndDate,
	isCheckingEnrollment, // Add this to destructuring
}: ProgramContentProps) {
	const router = useRouter();
	const { userId, isSignedIn } = useAuth(); // Add isSignedIn
	const [courseEnrollments, setCourseEnrollments] = useState<
		Record<number, boolean>
	>({});

	// Modificar para filtrar cursos duplicados por ID
	const safeMateriasWithCursos =
		program.materias?.filter(
			(materia): materia is MateriaWithCourse & { curso: Course } =>
				materia.curso !== undefined && 'id' in materia.curso
		) ?? [];

	// Filtrar cursos únicos basados en el ID del curso
	const uniqueCourses = safeMateriasWithCursos.reduce(
		(acc, materia) => {
			if (!acc.some((item) => item.curso.id === materia.curso.id)) {
				acc.push(materia);
			}
			return acc;
		},
		[] as (MateriaWithCourse & { curso: Course })[]
	);

	const courses = uniqueCourses.map((materia) => materia.curso);

	// Añadir console.log para debugging
	console.log('Course data:', courses[0]);
	console.log(
		'Courses isActive status:',
		courses.map((c) => ({ id: c.id, isActive: c.isActive }))
	);

	const formatDate = (dateString: string | null) => {
		if (!dateString) return '';
		return new Date(dateString).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	// Move course enrollment checks to useEffect
	useEffect(() => {
		const checkCourseEnrollments = async () => {
			if (!userId) {
				return;
			}

			try {
				const enrollmentChecks = await Promise.all(
					courses.map(async (course) => {
						try {
							const isEnrolled = await isUserEnrolled(course.id, userId);
							return [course.id, isEnrolled] as [number, boolean];
						} catch (error) {
							console.error(
								`Error checking enrollment for course ${course.id}:`,
								error
							);
							return [course.id, false] as [number, boolean];
						}
					})
				);

				const enrollmentMap = Object.fromEntries(enrollmentChecks) as Record<
					number,
					boolean
				>;
				setCourseEnrollments(enrollmentMap);
			} catch (error) {
				console.error('Error checking course enrollments:', error);
			}
		};

		void checkCourseEnrollments();
	}, [userId, courses]);

	// Actualizar el handleCourseClick para simplificarlo y evitar el parámetro no utilizado
	const handleCourseClick = (e: React.MouseEvent) => {
		if (!isSignedIn) {
			e.preventDefault();
			const currentPath = window.location.pathname;
			void router.push(`/sign-in?redirect_url=${currentPath}`);
		}
	};

	return (
		<div className="relative rounded-lg border bg-white p-6 shadow-sm">
			{isEnrolled && !isSubscriptionActive && (
				<Alert
					variant="destructive"
					className="mb-6 border-2 border-red-500 bg-red-50"
				>
					<div className="flex items-center gap-3">
						<FaCrown className="size-8 text-red-500" />
						<div className="flex-1">
							<AlertTitle className="mb-2 text-xl font-bold text-red-700">
								¡Tu suscripción Premium ha expirado!
							</AlertTitle>
							<AlertDescription className="text-base text-red-600">
								<p className="mb-4">
									Para seguir accediendo a los cursos de este programa y
									continuar tu aprendizaje, necesitas renovar tu suscripción
									Premium.
								</p>
								<Button
									onClick={() => router.push('/planes')}
									className="transform rounded-lg bg-red-500 px-6 py-2 font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-red-600 active:scale-95"
								>
									<FaCrown className="mr-2" />
									Renovar Suscripción Premium
								</Button>
							</AlertDescription>
						</div>
					</div>
				</Alert>
			)}

			<div className="mb-6">
				{/* Subscription Status Section */}
				<div className="mb-4 flex flex-row items-center justify-between">
					<h2 className="text-2xl font-bold text-background">
						Cursos Del Programa
					</h2>
					{isSignedIn && isSubscriptionActive && (
						<div className="flex flex-col items-end gap-1">
							<div className="flex items-center gap-2 text-green-500">
								<FaCheck className="size-4" />
								<span className="font-medium">Suscripción Activa</span>
							</div>
							{subscriptionEndDate && (
								<p className="text-sm text-red-500">
									Finaliza: {formatDate(subscriptionEndDate)}
								</p>
							)}
						</div>
					)}
				</div>
			</div>

			<div
				className={
					!isSubscriptionActive && isEnrolled
						? 'pointer-events-none opacity-50 blur-[1px] filter'
						: ''
				}
			>
				<div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{courses.map((course, index) => (
						<div key={`${course.id}-${index}`} className="group relative">
							<div className="absolute -inset-2 animate-gradient rounded-xl bg-linear-to-r from-black via-[#000B19] to-[#012B4A] opacity-0 blur-[8px] transition-all duration-500 group-hover:opacity-100" />
							<Card
								className={`zoom-in relative flex h-full flex-col justify-between overflow-hidden border-0 bg-gray-800 text-white transition-transform duration-300 ease-in-out hover:scale-[1.02] ${
									!course.isActive ? 'opacity-50' : ''
								}`}
							>
								<CardHeader className="px-6">
									<AspectRatio ratio={16 / 9}>
										<div className="relative size-full">
											<Image
												src={
													course.coverImageKey
														? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
														: 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
												}
												alt={course.title || 'Imagen del curso'}
												className="rounded-md object-cover transition-transform duration-300 hover:scale-105"
												fill
												sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
												quality={75}
											/>
										</div>
									</AspectRatio>
								</CardHeader>

								<CardContent className="-mt-3 flex grow flex-col justify-between space-y-2">
									<div className="flex items-center justify-between">
										<CardTitle className="rounded text-lg text-background">
											<div className="font-bold text-primary">
												{course.title}
											</div>
										</CardTitle>
										{courseEnrollments[course.id] && (
											<div className="flex items-center text-green-500">
												<CheckCircleIcon className="size-5" />
												<span className="ml-1 text-sm font-bold">Inscrito</span>
											</div>
										)}
									</div>
									<div className="flex items-center justify-between">
										<Badge
											variant="outline"
											className="border-primary bg-background text-primary hover:bg-black/70"
										>
											{course.category?.name}
										</Badge>
										<p className="text-sm font-bold text-red-500">
											{course.modalidad?.name}
										</p>
									</div>
									<p className="line-clamp-2 text-sm text-gray-300">
										{course.description}
									</p>
									<div className="flex w-full justify-between">
										<p className="text-sm font-bold text-gray-300 italic">
											Educador:{' '}
											<span className="font-bold italic">
												{course.instructor}
											</span>
										</p>
										<div className="flex items-center">
											<StarIcon className="size-5 text-yellow-500" />
											<span className="ml-1 text-sm font-bold text-yellow-500">
												{(course.rating ?? 0).toFixed(1)}
											</span>
										</div>
									</div>
									<div className="mt-2 w-full">
										{isCheckingEnrollment && isSignedIn ? (
											<Link href="#" className="flex items-center">
												<Button
													disabled
													className="group/button relative inline-flex h-10 w-full items-center justify-center overflow-hidden rounded-md border border-white/20 bg-background p-2 text-primary"
												>
													<Icons.spinner className="mr-2 size-4 animate-spin" />
													<span className="font-bold">Cargando...</span>
												</Button>
											</Link>
										) : (
											<Link
												href={
													course.isActive
														? `/estudiantes/cursos/${course.id}`
														: '#'
												}
												onClick={(e) => !isSignedIn && handleCourseClick(e)}
												className="block w-full"
											>
												<Button
													disabled={!course.isActive || isCheckingEnrollment}
													className={`w-full ${
														!course.isActive
															? 'cursor-not-allowed bg-gray-600 hover:bg-gray-600'
															: ''
													} group/button relative inline-flex h-10 items-center justify-center overflow-hidden rounded-md border border-white/20 ${
														!course.isActive
															? 'pointer-events-none bg-gray-600 text-gray-400'
															: 'bg-background text-primary active:scale-95'
													}`}
												>
													<span className="font-bold">
														{!course.isActive
															? 'No Disponible'
															: !isSignedIn
																? 'Iniciar Sesión'
																: !isEnrolled
																	? 'Requiere Inscripción'
																	: courseEnrollments[course.id]
																		? 'Continuar Curso'
																		: 'Ver Curso'}
													</span>
													{course.isActive && (
														<>
															<ArrowRightCircleIcon className="ml-1.5 size-5 animate-bounce-right" />
															<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
																<div className="relative h-full w-10 bg-white/30" />
															</div>
														</>
													)}
												</Button>
											</Link>
										)}
									</div>
								</CardContent>
							</Card>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}