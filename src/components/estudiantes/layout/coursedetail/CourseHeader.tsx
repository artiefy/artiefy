'use client';

<<<<<<< HEAD
import { useState, useEffect, useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useUser } from '@clerk/nextjs';
import { StarIcon } from '@heroicons/react/24/solid';
import {
	FaCalendar,
	FaClock,
	FaUserGraduate,
	FaCheck,
	FaTrophy,
	FaCrown,
	FaStar,
} from 'react-icons/fa';
import { IoGiftOutline } from 'react-icons/io5';
import useSWR from 'swr';
=======
import Image from 'next/image';

import { StarIcon } from '@heroicons/react/24/solid';
import { FaCalendar, FaClock, FaUserGraduate, FaCheck } from 'react-icons/fa';
>>>>>>> dev/miguel

import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Badge } from '~/components/estudiantes/ui/badge';
import { Button } from '~/components/estudiantes/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
} from '~/components/estudiantes/ui/card';
import { Icons } from '~/components/estudiantes/ui/icons';
import { blurDataURL } from '~/lib/blurDataUrl';
<<<<<<< HEAD
import { cn } from '~/lib/utils';
import { formatDate, type GradesApiResponse } from '~/lib/utils2';
=======
>>>>>>> dev/miguel

import { CourseContent } from './CourseContent';
import { GradeModal } from './CourseGradeModal';

import type { Course, CourseMateria } from '~/types';

export const revalidate = 3600;

interface ExtendedCourse extends Course {
	progress?: number;
	finalGrade?: number;
}

import type { Course } from '~/types';

interface CourseHeaderProps {
	course: ExtendedCourse;
	totalStudents: number;
	isEnrolled: boolean;
	isEnrolling: boolean;
	isUnenrolling: boolean;
	isSubscriptionActive: boolean;
	subscriptionEndDate: string | null;
	onEnroll: () => Promise<void>;
	onUnenroll: () => Promise<void>;
	isCheckingEnrollment?: boolean;
}

const BADGE_GRADIENTS = [
	'from-pink-500 via-red-500 to-yellow-500',
	'from-green-300 via-blue-500 to-purple-600',
	'from-pink-300 via-purple-300 to-indigo-400',
	'from-yellow-400 via-pink-500 to-red-500',
	'from-blue-400 via-indigo-500 to-purple-600',
	'from-green-400 via-cyan-500 to-blue-500',
	'from-orange-400 via-pink-500 to-red-500',
];

const getBadgeGradient = (index: number) => {
	return BADGE_GRADIENTS[index % BADGE_GRADIENTS.length];
};

// Update fetcher with explicit typing
const fetcher = async (url: string): Promise<GradesApiResponse> => {
	const res = await fetch(url);
	if (!res.ok) throw new Error('Error fetching grades');
	const data = (await res.json()) as GradesApiResponse;
	return data;
};

// Add error type
interface FetchError {
	error?: string;
	message?: string;
}

export function CourseHeader({
	course,
	totalStudents,
	isEnrolled,
	isEnrolling,
	isUnenrolling,
	isSubscriptionActive,
	subscriptionEndDate,
	onEnroll,
	onUnenroll,
}: Omit<CourseHeaderProps, 'props'>) {
	const { user } = useUser();
	const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
	const [isLoadingGrade, setIsLoadingGrade] = useState(true);

	// Replace useEffect with useSWR
	// Improve error handling with proper types
	const { data: gradesData, error: gradesError } = useSWR<
		GradesApiResponse,
		FetchError
	>(
		user?.id
			? `/api/grades/materias?userId=${user.id}&courseId=${course.id}`
			: null,
		fetcher,
		{
			refreshInterval: 5000, // Poll every 5 seconds
			revalidateOnFocus: true,
		}
	);

	const currentFinalGrade = useMemo(() => {
		if (!gradesData?.materias?.length) return 0;

		// Simplemente calcular el promedio de las notas
		const average =
			gradesData.materias.reduce((acc, materia) => acc + materia.grade, 0) /
			gradesData.materias.length;

		console.log('Cálculo de nota:', {
			materias: gradesData.materias,
			promedio: average,
			mostrarCertificado: average >= 3,
		});

		return Number(average.toFixed(2));
	}, [gradesData]);

	// Update loading state based on SWR
	// Update loading state with proper error handling
	useEffect(() => {
		setIsLoadingGrade(!gradesData && !gradesError);
	}, [gradesData, gradesError]);

	// Debug logs
	// Debug logs with proper error handling
	useEffect(() => {
		console.log('SWR State:', {
			gradesData,
			currentFinalGrade,
			isLoadingGrade,
			error: gradesError?.message ?? 'No error',
			shouldShowCertificate:
				isEnrolled &&
				course.progress === 100 &&
				currentFinalGrade >= 3 &&
				!isLoadingGrade,
		});
	}, [
		gradesData,
		currentFinalGrade,
		isLoadingGrade,
		gradesError,
		isEnrolled,
		course.progress,
	]);

	// Add debug log for all conditions
	// Add debug log with safer type checking
	useEffect(() => {
		console.log('Debug Certificate Button Conditions:', {
			isEnrolled,
			courseProgress: course.progress,
			currentFinalGrade,
			allConditions: {
				isEnrolled,
				hasProgress: course.progress === 100,
				hasPassingGrade: currentFinalGrade >= 3,
			},
			shouldShowButton:
				isEnrolled && course.progress === 100 && currentFinalGrade >= 3,
		});
	}, [isEnrolled, course.progress, currentFinalGrade]);

	// Helper function to format dates
	const formatDateString = (date: string | number | Date): string => {
		return formatDate(new Date(date));
	};

	const areAllLessonsCompleted = useMemo(() => {
		return (
			course.lessons?.every((lesson) => lesson.porcentajecompletado === 100) ??
			false
		);
	}, [course.lessons]);

	const canAccessGrades = isEnrolled && areAllLessonsCompleted;
	const canAccessCertificate = canAccessGrades && currentFinalGrade >= 3;

	const getCourseTypeLabel = () => {
		const courseType = course.courseType;
		if (!courseType) {
			return null;
		}

		const { requiredSubscriptionLevel } = courseType;

		// Mostrar el precio individual cuando el curso es tipo 4
		if (course.courseTypeId === 4 && course.individualPrice) {
			return (
				<div className="flex items-center gap-1">
					<FaStar className="text-lg text-blue-500" />
					<span className="text-base font-bold text-blue-500">
						${course.individualPrice.toLocaleString()}
					</span>
				</div>
			);
		}

		if (requiredSubscriptionLevel === 'none') {
			return (
				<div className="flex items-center gap-1">
					<IoGiftOutline className="text-lg text-green-500" />
					<span className="text-base font-bold text-green-500">GRATUITO</span>
				</div>
			);
		}

		const color =
			requiredSubscriptionLevel === 'premium'
				? 'text-purple-500'
				: 'text-orange-500';
		return (
			<div className={`flex items-center gap-1 ${color}`}>
				<FaCrown className="text-lg" />
				<span className="text-base font-bold">
					{requiredSubscriptionLevel.toUpperCase()}
				</span>
			</div>
		);
	};

	return (
		<Card className="overflow-hidden p-0">
			<CardHeader className="px-0">
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
						<h1 className="text-3xl font-bold text-white">{course.title}</h1>
					</div>
				</AspectRatio>
			</CardHeader>

			<CardContent className="mx-6 space-y-4">
				{/* Instructor info and stats */}
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<h3 className="text-lg font-extrabold text-background">
							{course.instructor}
						</h3>
						<em className="font-bold text-gray-600">Educador</em>
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

				{/* Course metadata - Modificar esta sección */}
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center space-x-4">
						<Badge
							variant="outline"
							className="border-primary bg-background text-primary hover:bg-black/70"
						>
							{course.category?.name}
						</Badge>
						{getCourseTypeLabel()} {/* Add the course type label here */}
						<div className="flex items-center">
							<FaCalendar className="mr-2 text-gray-600" />
							<span className="text-sm text-gray-600">
								Creado: {formatDateString(course.createdAt)}
							</span>
						</div>
						<div className="flex items-center">
							<FaClock className="mr-2 text-gray-600" />
							<span className="text-sm text-gray-600">
								Última actualización: {formatDateString(course.updatedAt)}
							</span>
						</div>
					</div>
					<Badge className="bg-red-500 text-white hover:bg-red-700">
						{course.modalidad?.name}
					</Badge>
				</div>

				{/* Course description y Mis Calificaciones button */}
				<div className="flex items-start justify-between gap-4">
					<div className="prose flex-1">
						<p className="leading-relaxed text-gray-700">
							{course.description ?? 'No hay descripción disponible.'}
						</p>
					</div>
					<Button
						onClick={() => setIsGradeModalOpen(true)}
						disabled={!canAccessGrades}
						className={cn(
							'h-9 shrink-0 px-4 font-semibold',
							canAccessGrades
								? 'bg-blue-500 text-white hover:bg-blue-600'
								: 'bg-gray-400/50 text-gray-700'
						)}
						aria-label={
							!isEnrolled
								? 'Debes inscribirte al curso'
								: 'Completa todas las clases para ver tus calificaciones'
						}
					>
						<FaTrophy className="mr-2 h-4 w-4" />
						<span className="text-sm font-semibold">Mis Calificaciones</span>
					</Button>
				</div>

				{/* Botón de certificado con texto descriptivo */}
				{canAccessCertificate && (
					<div className="mt-6 space-y-4">
						<div className="relative mx-auto size-40">
							<Image
								src="/diploma-certificate.svg"
								alt="Certificado"
								fill
								className="transition-all duration-300 hover:scale-110"
							/>
						</div>
						<p className="text-center font-serif text-lg text-gray-600 italic">
							¡Felicitaciones! Has completado exitosamente el curso con una
							calificación sobresaliente. Tu certificado está listo para ser
							visualizado y compartido.
						</p>
						<Button
							asChild
							className="group relative w-full bg-green-500 p-0 text-white shadow-lg transition-all hover:bg-green-600"
						>
							<Link
								href={`/estudiantes/certificados/${course.id}`}
								className="relative flex h-full w-full items-center justify-center gap-2 overflow-hidden py-3"
							>
								{/* Fondo animado con opacidad ajustada */}
								<div className="absolute inset-0 animate-pulse bg-gradient-to-r from-green-600/40 to-green-400/40" />

								{/* Contenido del botón */}
								<div className="relative z-10 flex items-center justify-center">
									<span className="text-lg font-bold">Ver Tu Certificado</span>
								</div>
							</Link>
						</Button>
					</div>
				)}

				{/* Add Materias section below description */}
				<div className="space-y-2">
					<h3 className="text-sm font-semibold text-gray-600">
						Materias asociadas:
					</h3>
					<div className="flex flex-wrap gap-2">
						{course.materias?.map((materia: CourseMateria, index: number) => (
							<Badge
								key={materia.id}
								variant="secondary"
								className={`bg-gradient-to-r ${getBadgeGradient(index)} text-white transition-all duration-300 hover:scale-105 hover:shadow-lg`}
							>
								{materia.title}
							</Badge>
						))}
					</div>
				</div>

				{/* Course lessons */}
				<CourseContent
					course={course}
					isEnrolled={isEnrolled}
					isSubscriptionActive={isSubscriptionActive}
					subscriptionEndDate={subscriptionEndDate}
				/>

				{/* Enrollment buttons - Simplificado sin skeleton */}
				<div className="flex justify-center pt-4">
					<div className="relative h-32 w-64">
						{isEnrolled ? (
							<div className="flex w-full flex-col space-y-4">
								<Button
									className="h-12 w-64 justify-center border-white/20 bg-primary text-lg font-semibold text-background transition-colors hover:bg-primary/90 active:scale-95"
									disabled={true}
								>
									<FaCheck className="mr-2" /> Suscrito Al Curso
								</Button>
								<Button
									className="h-12 w-64 justify-center border-white/20 bg-red-500 text-lg font-semibold hover:bg-red-600"
									onClick={onUnenroll}
									disabled={isUnenrolling}
								>
									{isUnenrolling ? (
										<Icons.spinner
											className="animate-spin text-white"
											style={{ width: '35px', height: '35px' }}
										/>
									) : (
										'Cancelar Suscripción'
									)}
								</Button>
							</div>
						) : (
							<Button
								onClick={onEnroll} // Use onEnroll directly from props
								disabled={isEnrolling}
								className="relative inline-block h-12 w-64 cursor-pointer rounded-xl bg-gray-800 p-px leading-6 font-semibold text-white shadow-2xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 disabled:opacity-50"
							>
<<<<<<< HEAD
=======
								<span className="absolute inset-0 rounded-xl bg-linear-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
>>>>>>> dev/miguel
								<span className="relative z-10 block rounded-xl bg-gray-950 px-6 py-3">
									<div className="relative z-10 flex items-center justify-center space-x-2">
										{isEnrolling ? (
											<Icons.spinner
												className="animate-spin text-white"
												style={{ width: '25px', height: '25px' }}
											/>
										) : (
											<>
												<span>
													{course.courseType?.requiredSubscriptionLevel ===
													'none'
														? 'Inscribirse Gratis'
														: 'Inscribirse al Curso'}
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
<<<<<<< HEAD
													/>
=======
													 />
>>>>>>> dev/miguel
												</svg>
											</>
										)}
									</div>
								</span>
							</Button>
						)}
					</div>
				</div>

				{/* Add GradeModal */}
				<GradeModal
					isOpen={isGradeModalOpen}
					onClose={() => setIsGradeModalOpen(false)}
					courseTitle={course.title}
					courseId={course.id}
					userId={user?.id ?? ''} // Pass dynamic user ID
				/>
			</CardContent>
		</Card>
	);
}
