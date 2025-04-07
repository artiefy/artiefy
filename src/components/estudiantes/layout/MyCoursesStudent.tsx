import Image from 'next/image';
import Link from 'next/link';

import { currentUser } from '@clerk/nextjs/server';
import { BookOpenIcon, StarIcon } from '@heroicons/react/24/outline';
import { ArrowRightCircleIcon } from '@heroicons/react/24/solid';

import { Badge } from '~/components/estudiantes/ui/badge';
import { getEnrolledCourses } from '~/server/actions/estudiantes/courses/getEnrolledCourses';
import { getEnrolledPrograms } from '~/server/actions/estudiantes/programs/getEnrolledPrograms';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';

const getImageUrl = (coverImageKey: string | null): string => {
	if (!coverImageKey || coverImageKey === 'NULL') {
		return 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';
	}
	return `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`.trimEnd();
};

// Update the Program interface
interface Program {
	id: number;
	title: string;
	coverImageKey: string | null;
	category: {
		name: string;
	} | null;
	rating: number;
}

// Update the Course interface
interface Course {
	id: number;
	title: string;
	coverImageKey: string | null;
	instructorName: string;
	progress: number;
	rating: number; // Add rating property
	category: {
		name: string;
	} | null;
}

export default async function MyCoursesStudent() {
	const user = await currentUser();

	if (!user) {
		throw new Error('Usuario no autenticado');
	}

	const courses = await getEnrolledCourses();
	const programs = await getEnrolledPrograms();

	// Correct filtering of courses
	const inProgressCourses = courses.filter((course) => course.progress < 100);
	const completedCourses = courses.filter((course) => course.progress === 100);

	return (
		<div className="container mx-auto mb-22 px-4">
			{/* Welcome Message */}
			<h1 className="text-primary mb-8 text-4xl font-bold">
				Bienvenido, {user.firstName}!
			</h1>

			{/* User Profile Section */}
			<div className="mb-8 rounded-lg bg-gray-800 p-6 text-white">
				<div className="flex items-center gap-4">
					<div className="relative h-16 w-16 overflow-hidden rounded-full">
						<Image
							src={user.imageUrl}
							alt={user.firstName ?? 'Profile'}
							fill
							sizes="(max-width: 768px) 10vw, (max-width: 1200px) 5vw, 4vw"
							priority
							className="object-cover"
						/>
					</div>
					<div>
						<h2 className="text-2xl font-bold">
							{user.firstName} {user.lastName}
						</h2>
						<p className="text-gray-300">
							{user.emailAddresses[0]?.emailAddress}
						</p>
					</div>
				</div>
			</div>

			{/* Programs Section */}
			{programs.length > 0 && (
				<section className="mb-12">
					<h2 className="text-primary mb-6 text-2xl font-bold">
						Mis Programas
					</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{programs.map((program: Program) => (
							<Card
								key={program.id}
								className="overflow-hidden bg-gray-800 py-0 text-white"
							>
								<div className="flex h-auto flex-col md:h-32 md:flex-row">
									<div className="w-full md:w-48">
										<div className="relative h-48 w-full md:h-full">
											<Image
												src={getImageUrl(program.coverImageKey)}
												alt={program.title}
												fill
												sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
												quality={75}
												className="object-cover"
											/>
										</div>
									</div>
									<CardContent className="flex w-full flex-col px-4 py-4">
										<div className="flex h-full flex-col justify-between gap-4">
											<div className="space-y-4">
												<div className="flex flex-col items-start justify-between gap-2 md:flex-row">
													<h3 className="text-primary text-lg leading-normal font-bold break-words md:text-lg">
														{program.title}
													</h3>
													<div className="flex shrink-0 items-center">
														{Array.from({ length: 5 }).map((_, index) => (
															<StarIcon
																key={index}
																className={`h-4 w-4 ${
																	index < Math.floor(program.rating ?? 0)
																		? 'text-yellow-400'
																		: 'text-gray-300'
																}`}
															/>
														))}
														<span className="ml-2 text-sm font-semibold text-yellow-400">
															{program.rating?.toFixed(1) ?? '0.0'}
														</span>
													</div>
												</div>
											</div>
											<div className="-mt-4 flex items-center gap-3">
												{program.category && (
													<Badge
														variant="outline"
														className="border-primary bg-background text-primary w-fit hover:bg-black/70"
													>
														{program.category.name}
													</Badge>
												)}
												<Button asChild className="w-fit shrink-0">
													<Link
														href={`/estudiantes/programas/${program.id}`}
														className="group/button bg-background text-primary relative inline-flex h-9 items-center justify-center overflow-hidden rounded-md border border-white/20 px-3 active:scale-95"
													>
														<p className="font-bold">Ver Programa</p>
														<ArrowRightCircleIcon className="animate-bounce-right mr-1 size-4" />
														<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
															<div className="relative h-full w-10 bg-white/30" />
														</div>
													</Link>
												</Button>
											</div>
										</div>
									</CardContent>
								</div>
							</Card>
						))}
					</div>
				</section>
			)}

			{/* In Progress Courses Section */}
			{inProgressCourses.length > 0 && (
				<section className="mb-12">
					<h2 className="text-primary mb-6 text-2xl font-bold">
						Mi Progreso de Aprendizaje
					</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{inProgressCourses.map((course: Course) => (
							<Card
								key={course.id}
								className="overflow-hidden bg-gray-800 py-0 text-white"
							>
								<div className="flex h-auto flex-col md:h-32 md:flex-row">
									<div className="w-full md:w-48">
										<div className="relative h-48 w-full md:h-full">
											<Image
												src={getImageUrl(course.coverImageKey)}
												alt={course.title}
												fill
												sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
												quality={75}
												className="object-cover"
											/>
										</div>
									</div>
									<CardContent className="flex w-full flex-col justify-between px-4 py-3">
										{/* Title and content wrapper */}
										<div className="flex flex-col space-y-2">
											{/* Common title for both mobile and desktop */}
											<div className="flex items-center justify-between">
												<h3 className="text-primary text-lg font-bold">
													{course.title}
												</h3>
												<div className="hidden shrink-0 items-center md:flex">
													{Array.from({ length: 5 }).map((_, index) => (
														<StarIcon
															key={index}
															className={`h-4 w-4 ${
																index < Math.floor(course.rating ?? 0)
																	? 'text-yellow-400'
																	: 'text-gray-300'
															}`}
														/>
													))}
													<span className="ml-2 text-sm font-semibold text-yellow-400">
														{course.rating?.toFixed(1) ?? '0.0'}
													</span>
												</div>
											</div>

											{/* Mobile layout */}
											<div className="md:hidden">
												{/* Instructor and Category row */}
												<div className="mb-2 flex items-center justify-between">
													<div className="flex items-center gap-2">
														<em className="text-sm font-bold text-gray-400">
															Educador:
														</em>
														<em className="text-sm font-extrabold text-gray-300">
															{course.instructorName}
														</em>
													</div>
													{course.category && (
														<Badge
															variant="outline"
															className="border-primary bg-background text-primary"
														>
															{course.category.name}
														</Badge>
													)}
												</div>

												<div className="space-y-2">
													{/* Progress label and rating in same row */}
													<div className="grid grid-cols-2 items-center gap-2">
														<span className="text-sm font-bold text-gray-300">
															Progreso Del Curso:
														</span>
														<div className="flex items-center justify-end">
															{Array.from({ length: 5 }).map((_, index) => (
																<StarIcon
																	key={index}
																	className={`h-4 w-4 ${
																		index < Math.floor(course.rating ?? 0)
																			? 'text-yellow-400'
																			: 'text-gray-300'
																	}`}
																/>
															))}
															<span className="ml-2 text-sm font-semibold text-yellow-400">
																{course.rating?.toFixed(1) ?? '0.0'}
															</span>
														</div>
													</div>

													{/* Progress bar and button in same row */}
													<div className="grid grid-cols-2 items-center gap-2">
														<Progress value={course.progress} className="h-2" />
														<Button asChild className="h-8 px-2">
															<Link
																href={`/estudiantes/cursos/${course.id}`}
																className="group/button bg-background text-primary relative inline-flex items-center justify-center overflow-hidden rounded-md border border-white/20 active:scale-95"
															>
																<p className="text-sm font-bold">Continuar</p>
																<ArrowRightCircleIcon className="animate-bounce-right ml-1 size-4" />
																<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)]">
																	<div className="relative h-full w-10 bg-white/30" />
																</div>
															</Link>
														</Button>
													</div>
												</div>
											</div>

											{/* Desktop layout - simplified */}
											<div className="hidden md:flex md:flex-col md:gap-2">
												<div className="flex items-center gap-2">
													<em className="text-sm font-bold text-gray-400">
														Educador:
													</em>
													<em className="text-sm font-extrabold text-gray-300">
														{course.instructorName}
													</em>
													{course.category && (
														<Badge
															variant="outline"
															className="border-primary bg-background text-primary"
														>
															{course.category.name}
														</Badge>
													)}
												</div>

												<div className="flex items-center gap-4">
													<div className="flex-1">
														<div className="mb-1 flex items-center justify-between">
															<span className="-mt-1 text-sm font-bold text-gray-300">
																Progreso Del Curso:
															</span>
															<span className="text-primary text-sm font-semibold">
																{course.progress}%
															</span>
														</div>
														<Progress
															value={course.progress}
															className="h-2 w-full"
														/>
													</div>
													<Button asChild className="shrink-0">
														<Link
															href={`/estudiantes/cursos/${course.id}`}
															className="group/button bg-background text-primary relative inline-flex h-9 items-center justify-center overflow-hidden rounded-md border border-white/20 px-3 active:scale-95"
														>
															<p className="font-bold">Continuar</p>
															<ArrowRightCircleIcon className="animate-bounce-right mr-1 size-4" />
															<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)]">
																<div className="relative h-full w-10 bg-white/30" />
															</div>
														</Link>
													</Button>
												</div>
											</div>
										</div>
									</CardContent>
								</div>
							</Card>
						))}
					</div>
				</section>
			)}

			{/* Completed Courses Section */}
			{completedCourses.length > 0 && (
				<section className="mt-12">
					<h2 className="text-primary mb-6 text-2xl font-bold">
						Cursos Completados
					</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{completedCourses.map((course: Course) => (
							<Card
								key={course.id}
								className="overflow-hidden bg-gray-800 py-0 text-white"
							>
								<div className="flex h-auto flex-col md:h-32 md:flex-row">
									<div className="w-full md:w-48">
										<div className="relative h-48 w-full md:h-full">
											<Image
												src={getImageUrl(course.coverImageKey)}
												alt={course.title}
												fill
												sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
												quality={75}
												className="object-cover"
											/>
										</div>
									</div>
									<CardContent className="flex w-full flex-col justify-between px-4 py-2">
										<div>
											<div className="flex items-center justify-between">
												<h3 className="text-primary text-lg font-bold">
													{course.title}
												</h3>
												{/* Rating Stars */}
												<div className="flex shrink-0 items-center">
													{Array.from({ length: 5 }).map((_, index) => (
														<StarIcon
															key={index}
															className={`h-4 w-4 ${
																index < Math.floor(course.rating ?? 0)
																	? 'text-yellow-400'
																	: 'text-gray-300'
															}`}
														/>
													))}
													<span className="ml-2 text-sm font-semibold text-yellow-400">
														{course.rating?.toFixed(1) ?? '0.0'}
													</span>
												</div>
											</div>
										</div>
										<div className="flex flex-col items-center gap-4 md:flex-row">
											<div className="flex-1">
												<div className="flex items-center justify-between">
													<span className="-mt-1 text-sm font-bold text-gray-300">
														Progreso Del Curso :
													</span>
												</div>
												<Progress
													value={course.progress}
													className="mb-0 h-2 w-full sm:pb-3"
												/>
											</div>
											<Button
												asChild
												className="mt-4 shrink-0 bg-green-600 hover:bg-green-700"
											>
												<Link
													href={`/estudiantes/cursos/${course.id}`}
													className="group/button relative inline-flex h-9 items-center justify-center overflow-hidden rounded-md border border-white/20 px-3 text-white active:scale-95"
												>
													<p className="font-bold">Ver Curso</p>
													<ArrowRightCircleIcon className="animate-bounce-right mr-1 size-4" />
													<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
														<div className="relative h-full w-10 bg-white/30" />
													</div>
												</Link>
											</Button>
										</div>
									</CardContent>
								</div>
							</Card>
						))}
					</div>
				</section>
			)}
			{courses.length === 0 && programs.length === 0 && (
				<>
					<div className="my-8 border-b border-gray-700/50" />
					<div className="mt-8 rounded-lg bg-gray-800 p-8 text-center text-white">
						<BookOpenIcon className="text-primary mx-auto h-12 w-12" />
						<h3 className="mt-4 text-xl font-semibold">
							No hay cursos inscritos
						</h3>
						<p className="mt-2 text-gray-300">
							Explora nuestro catálogo y comienza tu viaje de aprendizaje.
						</p>
						<Link
							href="/estudiantes"
							className="bg-primary text-background hover:bg-primary/90 mt-4 inline-block rounded-md px-6 py-2 font-semibold"
						>
							Ver cursos disponibles
						</Link>
					</div>
				</>
			)}
		</div>
	);
}
