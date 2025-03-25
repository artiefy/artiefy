import Image from 'next/image';
import Link from 'next/link';

import { currentUser } from '@clerk/nextjs/server';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import { ArrowRightCircleIcon } from '@heroicons/react/24/solid';

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

interface Program {
	id: number;
	title: string;
	coverImageKey: string | null;
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
			<h1 className="mb-8 text-4xl font-bold text-primary">
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
					<h2 className="mb-6 text-2xl font-bold text-primary">
						Mis Programas
					</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{programs.map((program: Program) => (
							<Card
								key={program.id}
								className="overflow-hidden bg-gray-800 py-0 text-white"
							>
								<div className="flex h-32">
									<div className="w-48">
										<div className="relative h-full w-full">
											<Image
												src={getImageUrl(program.coverImageKey)}
												alt={program.title}
												fill
												className="object-cover"
												sizes="(max-width: 768px) 100vw, 192px"
												quality={75}
											/>
										</div>
									</div>
									<CardContent className="flex w-full flex-col justify-between px-4 py-3">
										<div>
											<h3 className="text-lg font-bold text-primary">
												{program.title}
											</h3>
										</div>
										<Button asChild className="mt-4 w-fit shrink-0">
											<Link
												href={`/estudiantes/programas/${program.id}`}
												className="group/button relative inline-flex h-9 items-center justify-center overflow-hidden rounded-md border border-white/20 bg-background px-3 text-primary active:scale-95"
											>
												<p className="font-bold">Ver Programa</p>
												<ArrowRightCircleIcon className="mr-1 size-4 animate-bounce-right" />
												<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
													<div className="relative h-full w-10 bg-white/30" />
												</div>
											</Link>
										</Button>
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
					<h2 className="mb-6 text-2xl font-bold text-primary">
						Mi Progreso de Aprendizaje
					</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{inProgressCourses.map((course) => (
							<Card
								key={course.id}
								className="overflow-hidden bg-gray-800 py-0 text-white"
							>
								<div className="flex h-32">
									<div className="w-48">
										<div className="relative h-full w-full">
											<Image
												src={getImageUrl(course.coverImageKey)}
												alt={course.title}
												fill
												className="object-cover"
												sizes="(max-width: 768px) 100vw, 192px"
												quality={75}
											/>
										</div>
									</div>
									<CardContent className="flex w-full flex-col justify-between px-4 py-3">
										<div>
											<h3 className="text-lg font-bold text-primary">
												{course.title}
											</h3>
											<div className="flex items-center gap-2">
												<em className="text-sm font-bold text-gray-400">
													Educador:
												</em>
												<em className="text-sm font-extrabold text-gray-300">
													{course.instructor}
												</em>
											</div>
										</div>
										<div className="flex items-center gap-4">
											<div className="flex-1">
												<div className="mb-1 flex items-center justify-between">
													<span className="-mt-1 text-sm font-bold text-gray-300">
														Progreso Del Curso :
													</span>
													<span className="text-sm font-semibold text-primary">
														{course.progress}%
													</span>
												</div>
												<Progress
													value={course.progress}
													className="h-2 w-full"
												/>
											</div>
											<Button asChild className="mt-4 shrink-0">
												<Link
													href={`/estudiantes/cursos/${course.id}`}
													className="group/button relative inline-flex h-9 items-center justify-center overflow-hidden rounded-md border border-white/20 bg-background px-3 text-primary active:scale-95"
												>
													<p className="font-bold">Continuar</p>
													<ArrowRightCircleIcon className="mr-1 size-4 animate-bounce-right" />
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

			{/* Completed Courses Section */}
			{completedCourses.length > 0 && (
				<section className="mt-12">
					<h2 className="mb-6 text-2xl font-bold text-primary">
						Cursos Completados
					</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{completedCourses.map((course) => (
							<Card
								key={course.id}
								className="overflow-hidden bg-gray-800 py-0 text-white"
							>
								<div className="flex h-32">
									<div className="w-48">
										<div className="relative h-full w-full">
											<Image
												src={getImageUrl(course.coverImageKey)}
												alt={course.title}
												fill
												className="object-cover"
												sizes="(max-width: 768px) 100vw, 192px"
												quality={75}
											/>
										</div>
									</div>
									<CardContent className="flex w-full flex-col justify-between px-4 py-3">
										<div>
											<h3 className="text-lg font-bold text-primary">
												{course.title}
											</h3>
											<div className="flex items-center gap-2">
												<em className="text-sm font-bold text-gray-400">
													Educador:
												</em>
												<em className="text-sm font-extrabold text-gray-300">
													{course.instructor}
												</em>
											</div>
										</div>
										<div className="flex items-center gap-4">
											<div className="flex-1">
												<div className="mb-1 flex items-center justify-between">
													<span className="-mt-1 text-sm font-bold text-gray-300">
														Progreso Del Curso :
													</span>
													<span className="text-sm font-semibold text-primary">
														{course.progress}%
													</span>
												</div>
												<Progress
													value={course.progress}
													className="h-2 w-full"
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
													<ArrowRightCircleIcon className="mr-1 size-4 animate-bounce-right" />
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
						<BookOpenIcon className="mx-auto h-12 w-12 text-primary" />
						<h3 className="mt-4 text-xl font-semibold">
							No hay cursos inscritos
						</h3>
						<p className="mt-2 text-gray-300">
							Explora nuestro catálogo y comienza tu viaje de aprendizaje.
						</p>
						<Link
							href="/estudiantes"
							className="mt-4 inline-block rounded-md bg-primary px-6 py-2 font-semibold text-background hover:bg-primary/90"
						>
							Ver cursos disponibles
						</Link>
					</div>
				</>
			)}
		</div>
	);
}
