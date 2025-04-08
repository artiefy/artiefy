'use client';

import { useState, useEffect, useMemo } from 'react';

import Image from 'next/image';

import { useUser } from '@clerk/nextjs';
import { StarIcon } from '@heroicons/react/24/solid';
import { FaUserGraduate, FaCalendar, FaCheck, FaTrophy } from 'react-icons/fa';
import { toast } from 'sonner';
import useSWR from 'swr';

import { EnrollmentCount } from '~/components/estudiantes/layout/EnrollmentCount';
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

import { ProgramContent } from './ProgramContent';
import { ProgramGradesModal } from './ProgramGradesModal';

import type { Program } from '~/types';

interface ProgramHeaderProps {
	program: Program;
	isEnrolled: boolean;
	isEnrolling: boolean;
	isUnenrolling: boolean;
	isSubscriptionActive: boolean;
	subscriptionEndDate: string | null;
	onEnrollAction: () => Promise<void>;
	onUnenrollAction: () => Promise<void>;
	isCheckingEnrollment: boolean;
}

// Add error type
interface FetchError {
	error?: string;
	message?: string;
}

export function ProgramHeader({
	program,
	isEnrolled,
	isEnrolling,
	isUnenrolling,
	isSubscriptionActive,
	subscriptionEndDate: _subscriptionEndDate,
	onEnrollAction,
	onUnenrollAction,
	isCheckingEnrollment,
}: ProgramHeaderProps) {
	const { user, isSignedIn } = useUser();
	const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
	const [isLoadingGrade, setIsLoadingGrade] = useState(true);

	// Replace useEffect with useSWR
	// Improve error handling with proper types
	const { data: gradesData, error: gradesError } = useSWR<
		GradesApiResponse,
		FetchError
	>(
		user?.id
			? `/api/grades/materias?userId=${user.id}&courseId=${program.id}`
			: null,
		async (url: string): Promise<GradesApiResponse> => {
			const res = await fetch(url);
			if (!res.ok) throw new Error('Error fetching grades');
			const data = (await res.json()) as GradesApiResponse;
			return data;
		},
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

	interface CourseGrade {
		courseTitle: string;
		finalGrade: number;
	}

	const coursesGrades = useMemo(() => {
		if (!gradesData?.materias?.length) return [];

		// Agrupar las materias por curso y calcular promedios
		const courseGrades = new Map<string, { sum: number; count: number }>();

		gradesData.materias.forEach((materia) => {
			if (!materia.courseTitle) return; // Skip if no courseTitle
			const current = courseGrades.get(materia.courseTitle) ?? {
				sum: 0,
				count: 0,
			};
			courseGrades.set(materia.courseTitle, {
				sum: current.sum + materia.grade,
				count: current.count + 1,
			});
		});

		// Convertir el Map a un array de CourseGrade
		return Array.from(courseGrades.entries()).map(
			([courseTitle, { sum, count }]): CourseGrade => ({
				courseTitle,
				finalGrade: Number((sum / count).toFixed(2)),
			})
		);
	}, [gradesData]);

	// Update loading state based on SWR
	// Update loading state with proper error handling
	useEffect(() => {
		setIsLoadingGrade(!gradesData && !gradesError);
	}, [gradesData, gradesError]);

	// Verificar plan Premium y fecha de vencimiento
	const isPremium = user?.publicMetadata?.planType === 'Premium';
	const subscriptionEndDate = user?.publicMetadata?.subscriptionEndDate as
		| string
		| null;
	const isSubscriptionValid =
		isPremium &&
		(!subscriptionEndDate || new Date(subscriptionEndDate) > new Date());
	const canEnroll = isSubscriptionActive && isSubscriptionValid;

	const getCategoryName = (program: Program) => {
		return program.category?.name ?? 'Sin categoría';
	};

	const handleSignInRedirect = async () => {
		toast.error('Inicio de sesión requerido', {
			description: 'Debes iniciar sesión para inscribirte en este programa',
			duration: 3000,
		});

		await new Promise((resolve) => setTimeout(resolve, 1000));

		const currentPath = `/estudiantes/programas/${program.id}`;
		const returnUrl = encodeURIComponent(currentPath);
		window.location.href = `/sign-in?redirect_url=${returnUrl}`;
	};

	const handleEnrollClick = async () => {
		if (!canEnroll) {
			window.open('/planes', '_blank', 'noopener,noreferrer');
			return;
		}
		await onEnrollAction();
	};

	const canAccessGrades = isEnrolled;

	return (
		<Card className="overflow-hidden p-0">
			<CardHeader className="px-0">
				<AspectRatio ratio={16 / 6}>
					<Image
						src={
							program.coverImageKey
								? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${program.coverImageKey}`
								: 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
						}
						alt={program.title}
						fill
						className="object-cover"
						priority
						sizes="100vw"
						placeholder="blur"
						blurDataURL={blurDataURL}
					/>
					<div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/50 to-transparent p-4 md:p-6">
						<h1 className="line-clamp-2 text-xl font-bold text-white md:text-2xl lg:text-3xl">
							{program.title}
						</h1>
					</div>
				</AspectRatio>
			</CardHeader>

			<CardContent className="mx-auto w-full max-w-7xl space-y-4 px-4 sm:px-6">
				{/* Program metadata */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-wrap items-center gap-2">
						<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
							<Badge
								variant="outline"
								className="border-primary bg-background text-primary w-fit hover:bg-black/70"
							>
								{getCategoryName(program)}
							</Badge>
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
								<div className="flex items-center">
									<FaCalendar className="mr-2 text-gray-600" />
									<span className="text-xs text-gray-600 sm:text-sm">
										Creado: {formatDate(program.createdAt?.toString() ?? '')}
									</span>
								</div>
								<div className="flex items-center">
									<FaCalendar className="mr-2 text-gray-600" />
									<span className="text-xs text-gray-600 sm:text-sm">
										Actualizado:{' '}
										{formatDate(program.updatedAt?.toString() ?? '')}
									</span>
								</div>
							</div>
						</div>
					</div>
					<div className="flex items-center justify-between gap-4 sm:gap-6">
						<div className="flex items-center">
							<FaUserGraduate className="mr-2 text-blue-600" />
							<EnrollmentCount programId={parseInt(program.id)} />
						</div>
						<div className="flex items-center">
							{Array.from({ length: 5 }).map((_, index) => (
								<StarIcon
									key={index}
									className={`h-4 w-4 sm:h-5 sm:w-5 ${
										index < Math.floor(program.rating ?? 0)
											? 'text-yellow-400'
											: 'text-gray-300'
									}`}
								/>
							))}
							<span className="ml-2 text-base font-semibold text-yellow-400 sm:text-lg">
								{program.rating?.toFixed(1) ?? '0.0'}
							</span>
						</div>
					</div>
				</div>

				{/* Program description */}
				<div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
					<div className="prose max-w-none">
						<p className="text-sm leading-relaxed text-gray-700 sm:text-base">
							{program.description ?? 'No hay descripción disponible.'}
						</p>
					</div>
					<Button
						onClick={() => setIsGradeModalOpen(true)}
						disabled={!canAccessGrades}
						className="h-9 w-full shrink-0 bg-blue-500 px-4 font-semibold text-white hover:bg-blue-600 sm:w-auto"
						aria-label={
							!isEnrolled
								? 'Debes inscribirte al programa'
								: 'Ver tus calificaciones'
						}
					>
						<FaTrophy className="mr-2 h-4 w-4" />
						<span className="text-sm font-semibold">Mis Calificaciones</span>
					</Button>
				</div>

				{/* Program courses */}
				<ProgramContent
					program={program}
					isEnrolled={isEnrolled}
					isSubscriptionActive={isSubscriptionActive}
					subscriptionEndDate={_subscriptionEndDate}
					isCheckingEnrollment={isCheckingEnrollment}
				/>

				<div className="flex justify-center pt-4">
					<div className="relative h-32 w-64">
						{!isSignedIn ? (
							<Button
								onClick={handleSignInRedirect}
								className="relative inline-block h-12 w-64 cursor-pointer rounded-xl bg-gray-800 p-px leading-6 font-semibold text-white shadow-2xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95"
							>
								<span className="relative z-10 block rounded-xl bg-gray-950 px-6 py-3">
									<div className="relative z-10 flex items-center justify-center space-x-2">
										<span>Iniciar sesión para inscribirse</span>
									</div>
								</span>
							</Button>
						) : isEnrolled ? (
							<div className="flex w-full flex-col space-y-4">
								<Button
									className="bg-primary text-background hover:bg-primary/90 h-12 w-64 justify-center border-white/20 text-lg font-semibold transition-colors active:scale-95"
									disabled={true}
								>
									<FaCheck className="mr-2" /> Suscrito Al Programa
								</Button>
								<Button
									className="h-12 w-64 justify-center border-white/20 bg-red-500 text-lg font-semibold hover:bg-red-600"
									onClick={onUnenrollAction}
									disabled={isUnenrolling}
								>
									{isUnenrolling ? (
										<Icons.spinner className="size-9 animate-spin text-white" />
									) : (
										'Cancelar Suscripción'
									)}
								</Button>
							</div>
						) : (
							<Button
								onClick={handleEnrollClick}
								disabled={isEnrolling || isCheckingEnrollment}
								className="relative inline-block h-12 w-64 cursor-pointer rounded-xl bg-gray-800 p-px leading-6 font-semibold text-white shadow-2xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 disabled:opacity-50"
							>
								<span className="absolute inset-0 rounded-xl bg-linear-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
								<span className="relative z-10 block rounded-xl bg-gray-950 px-6 py-3">
									<div className="relative z-10 flex items-center justify-center space-x-2">
										{isCheckingEnrollment ? (
											<>
												<Icons.spinner
													className="animate-spin text-white"
													style={{ width: '20px', height: '20px' }}
												/>
												<span>Cargando...</span>
											</>
										) : isEnrolling ? (
											<>
												<Icons.spinner
													className="animate-spin text-white"
													style={{ width: '25px', height: '25px' }}
												/>
												<span>Inscribiendo...</span>
											</>
										) : (
											<>
												<span className="transition-all duration-500 group-hover:translate-x-1">
													{!canEnroll
														? 'Obtener Plan Premium'
														: 'Inscribirse al Programa'}
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
				<ProgramGradesModal
					isOpen={isGradeModalOpen}
					onCloseAction={() => setIsGradeModalOpen(false)}
					programTitle={program.title}
					finalGrade={currentFinalGrade}
					isLoading={isLoadingGrade}
					coursesGrades={coursesGrades}
				/>
			</CardContent>
		</Card>
	);
}
