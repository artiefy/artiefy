'use client';

import { useState, useEffect, useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { RocketLaunchIcon, StarIcon } from '@heroicons/react/24/solid';

import { StudenProgram } from '~/components/estudiantes/layout/studentdashboard/StudenProgram';
import StudentChatbot from '~/components/estudiantes/layout/studentdashboard/StudentChatbot';
import { Badge } from '~/components/estudiantes/ui/badge';
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '~/components/estudiantes/ui/carousel';
import { blurDataURL } from '~/lib/blurDataUrl';
import { type Course, type Program } from '~/types';
import '~/styles/searchBar.css';

interface StudentDashboardProps {
	initialCourses: Course[];
	initialPrograms: Program[];
}

export default function StudentDashboard({
	initialCourses,
	initialPrograms,
}: StudentDashboardProps) {
	const [courses] = useState<Course[]>(initialCourses);
	const [sortedPrograms] = useState(() => {
		if (!Array.isArray(initialPrograms)) {
			console.warn('initialPrograms is not an array:', initialPrograms);
			return [];
		}
		return [...initialPrograms].sort((a, b) => {
			const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
			const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
			return dateB - dateA;
		});
	});
	const [currentSlide, setCurrentSlide] = useState(0);
	const [searchQuery, setSearchQuery] = useState('');

	console.log('Programs received:', initialPrograms); // Añadir este log para debug

	const truncateDescription = (description: string, maxLength: number) => {
		if (description.length <= maxLength) return description;
		return description.slice(0, maxLength) + '...';
	};

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentSlide(
				(prevSlide) => (prevSlide + 1) % Math.min(courses.length, 5)
			);
		}, 5000);

		return () => clearInterval(interval);
	}, [courses.length]);

	const sortedCourses = useMemo(() => {
		return [...courses].sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	}, [courses]);

	const latestFiveCourses = sortedCourses.slice(0, 5);
	const latestTenCourses = sortedCourses.slice(0, 10);

	return (
		<div className="flex min-h-screen flex-col">
			<main className="grow">
				<div className="container mx-auto px-8 sm:px-12 lg:px-16">
					<div className="flex flex-col space-y-12 sm:space-y-16">
						<div className="mt-8 flex animate-zoom-in flex-col items-center space-y-4">
							<div className="flex items-center">
								<RocketLaunchIcon className="size-6 text-orange-500 sm:size-7" />
								<span className="ml-2 text-2xl font-bold whitespace-nowrap text-primary sm:text-3xl">
									Artie IA
								</span>
							</div>
							<form className="flex w-full flex-col items-center space-y-2">
								<div className="input-container w-full">
									<input
										required
										className="input w-full"
										name="search"
										placeholder="Dime que deseas buscar..."
										type="search"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
									/>
								</div>
							</form>
						</div>

						<div className="animation-delay-100 relative h-[300px] animate-zoom-in overflow-hidden px-8 sm:h-[400px] md:h-[500px]">
							{latestFiveCourses.map((course, index) => (
								<div
									key={course.id}
									className={`absolute inset-0 transition-opacity duration-500 ${
										index === currentSlide ? 'opacity-100' : 'opacity-0'
									}`}
								>
									<div className="relative size-full">
										<Image
											src={
												course.coverImageKey && course.coverImageKey !== 'NULL'
													? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
													: 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
											}
											alt={course.title}
											layout="fill"
											className="object-cover"
											priority={index === currentSlide}
											sizes="100vw"
											quality={85}
											placeholder="blur"
											blurDataURL={blurDataURL}
										/>
									</div>
									<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4 text-primary">
										<div className="mx-auto w-[90%] max-w-4xl text-center">
											<h2 className="mb-2 text-center text-2xl font-semibold sm:mb-4 sm:text-3xl md:text-4xl">
												{course.title}
											</h2>
											<Badge
												variant="outline"
												className="mb-2 border-primary text-primary"
											>
												{course.category?.name ?? 'Sin categoría'}
											</Badge>
											<p className="mb-2 line-clamp-2 hidden text-center text-sm sm:block sm:text-base md:text-lg lg:text-xl">
												{truncateDescription(course.description ?? '', 150)}
											</p>
											<p className="mb-1 hidden text-sm font-bold sm:block sm:text-base md:text-lg">
												Educador: {course.instructor}
											</p>
											<p className="mb-1 hidden text-sm font-bold text-red-500 sm:block sm:text-base md:text-lg">
												{course.modalidad?.name ?? 'Modalidad no especificada'}
											</p>
											<div className="flex items-center justify-center">
												<StarIcon className="size-4 text-yellow-500 sm:size-5" />
												<span className="ml-1 text-sm text-yellow-500 sm:text-base">
													{(course.rating ?? 0).toFixed(1)}
												</span>
											</div>
										</div>
									</div>
								</div>
							))}
							<div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
								{latestFiveCourses.map((_, index) => (
									<button
										key={index}
										className={`size-3 rounded-full ${
											index === currentSlide ? 'bg-primary' : 'bg-gray-300'
										}`}
										onClick={() => setCurrentSlide(index)}
									/>
								))}
							</div>
						</div>

						{/* Top Cursos section */}
						<div className="animation-delay-200 relative animate-zoom-in px-24">
							<h2 className="mb-4 text-xl font-bold text-primary md:text-2xl">
								Top Cursos
							</h2>
							<div>
								<Carousel className="w-full">
									<CarouselContent>
										{latestTenCourses.map((course) => (
											<CarouselItem
												key={course.id}
												className="pl-4 md:basis-1/2 lg:basis-1/3"
											>
												<div className="relative h-48 w-full md:h-64">
													<Image
														src={
															course.coverImageKey &&
															course.coverImageKey !== 'NULL'
																? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
																: 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
														}
														alt={course.title}
														fill
														className="rounded-lg object-cover"
														sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
														quality={85}
														placeholder="blur"
														blurDataURL={blurDataURL}
													/>
													<div className="absolute inset-x-0 bottom-0 bg-black/50 p-2 text-white">
														<Link href={`/estudiantes/cursos/${course.id}`}>
															<h3 className="text-lg font-bold text-white hover:underline active:scale-95">
																{course.title}
															</h3>
														</Link>
														<div className="mb-2 flex items-center justify-between">
															<Badge
																variant="outline"
																className="mb-2 border-primary bg-background text-[9px] text-primary lg:text-sm"
															>
																{course.category?.name}
															</Badge>
															<span className="text-sm font-bold text-red-500">
																{course.modalidad?.name}
															</span>
														</div>
														<div className="flex items-center justify-between">
															<p className="text-sm text-primary italic">
																Educador: <span>{course.instructor}</span>
															</p>
															<div className="flex items-center">
																<StarIcon className="size-4 text-yellow-500" />
																<span className="ml-1 text-sm font-bold text-yellow-500">
																	{(course.rating ?? 0).toFixed(1)}
																</span>
															</div>
														</div>
													</div>
												</div>
											</CarouselItem>
										))}
									</CarouselContent>
									<CarouselPrevious className="-left-20 size-12 bg-black/50 text-white" />
									<CarouselNext className="-right-20 size-12 bg-black/50 text-white" />
								</Carousel>
							</div>
						</div>

						{/* Programas section */}
						<div className="animation-delay-300 relative animate-zoom-in px-24">
							<h2 className="ml-4 text-xl font-bold text-primary md:text-2xl">
								Programas
							</h2>
							<div>
								<Carousel className="w-full">
									<CarouselContent className="my-6">
										{sortedPrograms.map((program) => (
											<CarouselItem
												key={program.id}
												className="md:basis-2/3 lg:basis-1/3"
											>
												<StudenProgram program={program} />
											</CarouselItem>
										))}
									</CarouselContent>
									<CarouselPrevious className="-left-20 size-12 bg-black/50 text-white" />
									<CarouselNext className="-right-20 size-12 bg-black/50 text-white" />
								</Carousel>
							</div>
						</div>
					</div>
				</div>
			</main>
			<StudentChatbot className="animation-delay-400 animate-zoom-in" />
		</div>
	);
}
