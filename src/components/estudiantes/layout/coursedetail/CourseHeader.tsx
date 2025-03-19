'use client';

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
} from 'react-icons/fa';
import useSWR from 'swr';

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
import { formatDate, type GradesApiResponse } from '~/lib/utils2';

import { CourseContent } from './CourseContent';
import { GradeModal } from './CourseGradeModal';

import type { Course, CourseMateria } from '~/types';

export const revalidate = 3600;

interface ExtendedCourse extends Course {
	progress?: number;
	finalGrade?: number;
}

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

const CertificateIcon = () => (
	<svg
		fill="#4B5563" // Cambiado a un gris elegante
		width="48" // Aumentado el tamaño para el icono debajo del botón
		height="48"
		viewBox="0 0 512 512"
		className="transition-all duration-300 hover:scale-110"
	>
		<path d="M278.5757,217.6939l16.3614-.0876c10.38-10.87,22.911-23.7955,39.2874-22.8363,16.44-.8844,28.9075,11.8155,39.29,22.8363,6.9471.267,20.3583-.7648,26.861,1.662V115.1441H111.625v166.25H231.2368l8.1391-8.2255.1751-16.3625A39.4791,39.4791,0,0,1,278.5757,217.6939ZM168.5,181.206c-17.2031-.2585-17.2992-25.9712,0-26.25h175c17.1817.3044,17.2821,25.9253,0,26.25Z" />
		<path d="M452.875,49.5191H59.125A13.0881,13.0881,0,0,0,46,62.5566V333.8941a13.1633,13.1633,0,0,0,13.125,13.125H234.7381c-11.63-10.2806-20.2322-23.7548-17.7628-39.375H98.5a13.1633,13.1633,0,0,1-13.125-13.125v-192.5A13.1066,13.1066,0,0,1,98.5,88.8941h315a13.1628,13.1628,0,0,1,13.125,13.125V243.8563c3.3282,7.4084,2.2174,21.2384,2.45,29.3123l11.5506,11.6371c18.4591,19.4717,12.86,46.1063-6.9129,62.2134h19.162A13.22,13.22,0,0,0,466,333.8941V62.5566A13.1446,13.1446,0,0,0,452.875,49.5191Z" />
		<path d="M409.7381,407.0429l-36.2241.2628L356.8,423.7557l13.0182,35.8364a4.3744,4.3744,0,0,0,8.0749.3567l12.1573-26.0428,25.94,12.14a4.3745,4.3745,0,0,0,5.9644-5.458Z" />
		<path d="M258.8006,407.0429l-12.2171,33.5453a4.3745,4.3745,0,0,0,5.9644,5.458l25.94-12.14L290.65,459.9574a4.3719,4.3719,0,0,0,8.0706-.3546l13.0182-35.7595-16.8014-16.5376Z" />
		<path d="M402.93,283.9961l-.1965-27.0362a13.0986,13.0986,0,0,0-13.0011-13.0011l-27.0361-.1965-19.25-18.9729a13.0962,13.0962,0,0,0-18.3865,0l-19.2475,18.9729-27.0361.1965a13.0942,13.0942,0,0,0-13.0011,13l-.1987,27.0372-18.9718,19.2474a13.0955,13.0955,0,0,0,0,18.3876L265.5767,340.88l.1966,27.0361a13.0985,13.0985,0,0,0,13.0011,13.0011l27.0361.1966,19.25,18.9729a13.0962,13.0962,0,0,0,18.3865,0l19.2474-18.9729,27.0362-.1966a13.0969,13.0969,0,0,0,13.0011-13L402.93,340.88l18.9719-19.2485a13.0943,13.0943,0,0,0,0-18.3865Zm-68.6755,63.4417c-46.2622-1.427-46.2537-68.5794,0-70C380.5166,278.867,380.5059,346.0162,334.2544,347.4378Z" />
	</svg>
);

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
}: CourseHeaderProps) {
	const { user } = useUser();
	const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
	const [isLoadingGrade, setIsLoadingGrade] = useState(true);

	// Replace useEffect with useSWR
	const { data: gradesData, error } = useSWR<GradesApiResponse, Error>(
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
	useEffect(() => {
		setIsLoadingGrade(!gradesData && !error);
	}, [gradesData, error]);

	// Debug logs
	useEffect(() => {
		console.log('SWR State:', {
			gradesData,
			currentFinalGrade,
			isLoadingGrade,
			error,
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
		error,
		isEnrolled,
		course.progress,
	]);

	// Add debug log for all conditions
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

				{/* Course metadata */}
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

				{/* Certificate Button with updated styling */}
				{isEnrolled && currentFinalGrade >= 3 && (
					<div className="mt-4 space-y-4 text-center">
						<Button
							asChild
							className="group relative w-full bg-green-500 p-0 text-white shadow-lg transition-all hover:bg-green-600"
						>
							<Link
								href={`/estudiantes/certificados/${course.id}`}
								className="relative flex h-full w-full items-center justify-center overflow-hidden py-3"
							>
								{/* Fondo animado con opacidad ajustada */}
								<div className="absolute inset-0 animate-pulse bg-gradient-to-r from-green-600/40 to-green-400/40" />

								{/* Contenido del botón sin icono */}
								<div className="relative z-10 flex items-center justify-center">
									<span className="text-lg font-bold">Ver Tu Certificado</span>
								</div>
							</Link>
						</Button>

						{/* Icono debajo del botón */}
						<div className="flex flex-col items-center space-y-3">
							<CertificateIcon />
							<p className="font-serif text-lg text-gray-600 italic">
								&ldquo;¡Felicitaciones! Has completado exitosamente el curso. Tu
								certificado está listo para ser visualizado y compartido. Este
								logro es testimonio de tu dedicación y esfuerzo.&rdquo;
							</p>
						</div>
					</div>
				)}

				{/* Add grade modal button next to materias */}
				<div className="flex items-center gap-4">
					<Button
						onClick={() => setIsGradeModalOpen(true)}
						className="bg-blue-500 text-white hover:bg-blue-600"
					>
						<FaTrophy className="mr-2" />
						Mis Calificaciones
					</Button>
				</div>

				{/* Course description */}
				<div className="prose max-w-none">
					<p className="leading-relaxed text-gray-700">
						{course.description ?? 'No hay descripción disponible.'}
					</p>
				</div>

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
											style={{ width: '25px', height: '25px' }}
										/>
									) : (
										'Cancelar Suscripción'
									)}
								</Button>
							</div>
						) : (
							<Button
								onClick={onEnroll}
								disabled={isEnrolling}
								className="relative inline-block h-12 w-64 cursor-pointer rounded-xl bg-gray-800 p-px leading-6 font-semibold text-white shadow-2xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 disabled:opacity-50"
							>
								<span className="absolute inset-0 rounded-xl bg-linear-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
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
													/>
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
