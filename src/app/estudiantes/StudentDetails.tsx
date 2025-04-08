'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import '~/styles/ia.css';
import '~/styles/searchBar.css';

import Image from 'next/image';
import Link from 'next/link';

import { StarIcon } from '@heroicons/react/24/solid';

import { StudentArtieIa } from '~/components/estudiantes/layout/studentdashboard/StudentArtieIa';
import StudentChatbot from '~/components/estudiantes/layout/studentdashboard/StudentChatbot';
import StudentGradientText from '~/components/estudiantes/layout/studentdashboard/StudentGradientText';
import { StudentProgram } from '~/components/estudiantes/layout/studentdashboard/StudentProgram';
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

export default function StudentDetails({
	initialCourses,
	initialPrograms,
}: {
	initialCourses: Course[];
	initialPrograms: Program[];
}) {
	const [courses] = useState<Course[]>(initialCourses);
	const [sortedPrograms] = useState<Program[]>(() => {
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
	const [currentSlide, setCurrentSlide] = useState<number>(0);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [chatbotKey, setChatbotKey] = useState<number>(0);
	const [showChatbot, setShowChatbot] = useState<boolean>(false);
	const [searchInProgress, setSearchInProgress] = useState<boolean>(false);

	const searchInitiated = useRef<boolean>(false);
	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Memoized values to prevent re-renders
	const sortedCourses = useMemo(() => {
		return [...courses].sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	}, [courses]);

	const latestFiveCourses = useMemo(
		() => sortedCourses.slice(0, 5),
		[sortedCourses]
	);
	const latestTenCourses = useMemo(
		() => sortedCourses.slice(0, 10),
		[sortedCourses]
	);

	// Use useCallback for stable function references
	const handleSearch = useCallback(
		(e?: React.FormEvent) => {
			e?.preventDefault();

			const trimmedQuery = searchQuery.trim();

			if (searchInProgress || !trimmedQuery || searchInitiated.current) return;

			// Clear any existing timeout
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
				searchTimeoutRef.current = null;
			}

			// Reset previous search state
			setShowChatbot(false);
			searchInitiated.current = true;

			// Debounce search to prevent multiple rapid calls
			searchTimeoutRef.current = setTimeout(() => {
				setSearchInProgress(true);
				setShowChatbot(true);
				setChatbotKey((prev) => prev + 1);
				// Reset search initiated after search is complete
				searchInitiated.current = false;
			}, 300);
		},
		[searchQuery, searchInProgress]
	);

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value;
			setSearchQuery(newValue);

			if (!newValue.trim()) {
				setShowChatbot(false);
				setSearchInProgress(false);
				searchInitiated.current = false;
				setChatbotKey(0);
			}
		},
		[]
	);

	// Slide interval effect with cleanup
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentSlide(
				(prevSlide) => (prevSlide + 1) % Math.min(courses.length, 5)
			);
		}, 5000);

		return () => clearInterval(interval);
	}, [courses.length]);

	// Cleanup effect for search state
	useEffect(() => {
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
				searchTimeoutRef.current = null;
			}
			searchInitiated.current = false;
			setSearchInProgress(false);
		};
	}, [searchQuery]);

	// Reset search state when chatbot visibility changes
	useEffect(() => {
		if (!showChatbot) {
			searchInitiated.current = false;
			setSearchInProgress(false);
		}
	}, [showChatbot]);

	const handleSearchIconClick = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			if (!searchQuery.trim()) return;
			handleSearch();
		},
		[searchQuery, handleSearch]
	);

	const truncateDescription = (description: string, maxLength: number) => {
		if (description.length <= maxLength) return description;
		return description.slice(0, maxLength) + '...';
	};

	return (
		<div className="-mb-8 flex min-h-screen flex-col sm:mb-0">
			<main className="grow">
				<div className="container mx-auto px-8 sm:px-12 lg:px-16">
					<div className="flex flex-col space-y-12 sm:space-y-16">
						<div className="animate-zoom-in mt-8 flex flex-col items-center space-y-4">
							<div className="flex items-center">
								<Image
									src="/artiefy-icon.png"
									alt="Artiefy Icon"
									width={62}
									height={62}
									className="size-[62px] sm:size-14"
									style={{ width: 'auto', height: 'auto' }}
									priority
								/>
								<div className="ml-2">
									<StudentArtieIa />
								</div>
							</div>
							<form
								onSubmit={(e) => {
									e.preventDefault();
									// Only handle search if not already in progress
									if (!searchInProgress) {
										handleSearch(e);
									}
								}}
								className="flex w-full flex-col items-center space-y-2"
							>
								<div className="input-container">
									<div className="search-container">
										<input
											required
											className="input placeholder:text-xs sm:placeholder:text-base"
											name="search"
											placeholder="Que Deseas Crear? Escribe Tu Idea..."
											type="search"
											value={searchQuery}
											onChange={handleSearchChange}
										/>
										<svg
											viewBox="0 0 24 24"
											className="search__icon"
											onClick={handleSearchIconClick}
											role="button"
											aria-label="Buscar"
											style={{
												cursor: 'pointer',
												outline: 'none',
												transition: 'transform 0.2s ease',
											}}
											onMouseEnter={(e) => {
												const path = e.currentTarget.querySelector('path');
												if (path) path.style.fill = '#01142B';
											}}
											onMouseLeave={(e) => {
												const path = e.currentTarget.querySelector('path');
												if (path) path.style.fill = '';
											}}
											onMouseDown={(e) => {
												e.currentTarget.style.transform = 'scale(1.1)';
												const path = e.currentTarget.querySelector('path');
												if (path) path.style.fill = '#01142B';
											}}
											onMouseUp={(e) => {
												e.currentTarget.style.transform = 'scale(1)';
											}}
										>
											<path
												d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"
												style={{
													transition: 'fill 0.2s ease',
												}}
											/>
										</svg>
									</div>
								</div>
							</form>
						</div>

						<div className="animation-delay-100 animate-zoom-in relative h-[300px] overflow-hidden px-8 sm:h-[400px] md:h-[500px]">
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
											fill
											className="object-cover"
											priority={index === currentSlide}
											sizes="100vw"
											quality={85}
											placeholder="blur"
											blurDataURL={blurDataURL}
										/>
									</div>
									<div className="text-primary absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4">
										<div className="mx-auto w-[90%] max-w-4xl text-center">
											<h2 className="mb-2 line-clamp-3 text-center text-3xl font-semibold sm:mb-4 sm:text-4xl md:text-6xl">
												{course.title}
											</h2>
											<Badge
												variant="outline"
												className="border-primary text-primary mb-2"
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
						<div className="animation-delay-200 animate-zoom-in relative px-12 sm:px-24">
							<div className="flex justify-center">
								<StudentGradientText className="mb-6 text-3xl sm:text-5xl">
									Top Cursos
								</StudentGradientText>
							</div>
							<div>
								<Carousel className="w-full">
									<CarouselContent className="">
										{latestTenCourses.map((course) => (
											<CarouselItem
												key={course.id}
												className="basis-full sm:basis-1/2 lg:basis-1/3"
											>
												<div className="relative aspect-[4/3] w-full">
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
													<div className="absolute inset-x-0 bottom-0 bg-black/50 p-4 text-white">
														<Link href={`/estudiantes/cursos/${course.id}`}>
															<h3 className="line-clamp-3 text-sm font-bold text-white hover:underline active:scale-95 sm:text-lg">
																{course.title}
															</h3>
														</Link>
														<div className="flex flex-wrap items-start justify-between gap-y-1 sm:mt-2 sm:mb-2">
															<Badge
																variant="outline"
																className="border-primary bg-background text-primary max-w-[40%] truncate text-[8px] sm:text-sm"
															>
																{course.category?.name}
															</Badge>
															<span className="max-w-[55%] text-right text-[8px] font-bold text-red-500 sm:text-base">
																{course.modalidad?.name}
															</span>
														</div>
														<div className="flex items-center justify-between">
															<p className="text-primary text-xs font-semibold italic sm:text-base">
																Educador: <span>{course.instructor}</span>
															</p>
															<div className="flex items-center">
																<StarIcon className="size-4 text-yellow-500 sm:size-5" />
																<span className="ml-1 text-sm font-bold text-yellow-500 sm:text-base">
																	{(course.rating ?? 0).toFixed(1)}
																</span>
															</div>
														</div>
													</div>
												</div>
											</CarouselItem>
										))}
									</CarouselContent>
									<CarouselPrevious className="-left-15 size-12 bg-black/50 text-white sm:-left-20 sm:size-12" />
									<CarouselNext className="-right-15 size-12 bg-black/50 text-white sm:-right-20 sm:size-12" />
								</Carousel>
							</div>
						</div>

						{/* Programas section */}
						<div className="animation-delay-300 animate-zoom-in relative px-4 sm:px-24">
							<div className="flex justify-center">
								<StudentGradientText className="text-3xl sm:text-5xl">
									Programas
								</StudentGradientText>
							</div>
							<div>
								<Carousel className="w-full">
									<CarouselContent className="my-6 pl-4 sm:pl-0">
										{sortedPrograms.map((program) => (
											<CarouselItem
												key={program.id}
												className="basis-[95%] sm:basis-2/3 lg:basis-1/3"
											>
												<StudentProgram program={program} />
											</CarouselItem>
										))}
									</CarouselContent>
									<CarouselPrevious className="-left-9 size-12 bg-black/50 text-white sm:-left-20 sm:size-12" />
									<CarouselNext className="-right-9 size-12 bg-black/50 text-white sm:-right-20 sm:size-12" />
								</Carousel>
							</div>
						</div>
					</div>
				</div>
			</main>
			<StudentChatbot
				isAlwaysVisible={true}
				showChat={showChatbot}
				key={`${chatbotKey}-${searchQuery}`}
				className="animation-delay-400 animate-zoom-in fixed"
				initialSearchQuery={searchQuery.trim()}
			/>
		</div>
	);
}
