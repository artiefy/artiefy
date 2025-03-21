'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { StarIcon, ArrowRightCircleIcon } from '@heroicons/react/24/solid';
import { FaCrown } from 'react-icons/fa';

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
	subscriptionEndDate: _subscriptionEndDate,
	isCheckingEnrollment, // Add this to destructuring
}: ProgramContentProps) {
	const router = useRouter();

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

			<h2 className="mb-6 text-2xl font-bold text-background">
				Cursos del programa
			</h2>

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
									<CardTitle className="rounded text-lg text-background">
										<div className="font-bold text-primary">{course.title}</div>
									</CardTitle>
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
										{isCheckingEnrollment ? (
											<Button
												asChild
												disabled
												className="group/button relative inline-flex h-10 w-full items-center justify-center overflow-hidden rounded-md border border-white/20 bg-background p-2 text-primary"
											>
												<Link href="#" className="flex items-center">
													<Icons.spinner className="mr-2 size-4 animate-spin" />
													<span className="font-bold">Cargando...</span>
												</Link>
											</Button>
										) : (
											<Button
												asChild
												disabled={!isEnrolled || !course.isActive}
												className={`w-full ${
													!isEnrolled || !course.isActive
														? 'cursor-not-allowed opacity-50'
														: ''
												}`}
											>
												<Link
													href={
														isEnrolled && course.isActive
															? `/estudiantes/cursos/${course.id}`
															: '#'
													}
													className={`group/button relative inline-flex h-10 w-full items-center justify-center rounded-md border border-white/20 ${
														!course.isActive
															? 'bg-gray-600 text-gray-400'
															: 'bg-background text-primary active:scale-95'
													}`}
													onClick={(e) =>
														(!isEnrolled || !course.isActive) &&
														e.preventDefault()
													}
												>
													<span className="font-bold">
														{!course.isActive
															? 'No Disponible'
															: !isEnrolled
																? 'Requiere Inscripción'
																: 'Ver Curso'}
													</span>
													{course.isActive && isEnrolled && (
														<ArrowRightCircleIcon className="ml-2 size-5 animate-bounce-right" />
													)}
													<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
														<div className="relative h-full w-10 bg-white/30" />
													</div>
												</Link>
											</Button>
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
