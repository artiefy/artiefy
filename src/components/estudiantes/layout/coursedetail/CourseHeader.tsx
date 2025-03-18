'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { StarIcon } from '@heroicons/react/24/solid';
import {
	FaCalendar,
	FaClock,
	FaUserGraduate,
	FaCheck,
	FaTrophy,
} from 'react-icons/fa';

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

import { CourseContent } from './CourseContent';
import { GradeModal } from './GradeModal';

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
	const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);

	const formatDate = (dateString: string | number | Date) =>
		new Date(dateString).toISOString().split('T')[0];

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

				{/* Add grade modal button next to materias */}
				<div className="flex items-center gap-4">
					<Button
						onClick={() => setIsGradeModalOpen(true)}
						className="bg-blue-500 text-white hover:bg-blue-600"
					>
						<FaTrophy className="mr-2" />
						Ver Nota Final
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

				{/* Add certificate button for completed courses */}
				{course.progress === 100 && (
					<div className="my-4">
						<Button
							asChild
							className="relative w-full animate-pulse bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 text-white transition-all hover:animate-none hover:from-green-500 hover:via-blue-600 hover:to-purple-700"
						>
							<Link href={`/estudiantes/certificados/${course.id}`}>
								<span className="relative z-10 flex items-center justify-center py-2">
									<FaTrophy className="mr-2" />
									Ver Tu Certificado
								</span>
								<div className="absolute inset-0 bg-white/20 blur-sm" />
							</Link>
						</Button>
					</div>
				)}

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
					userId="user_2tNiV1LlLNv387Gz8ZlZ3SWPm7K"
				/>
			</CardContent>
		</Card>
	);
}
