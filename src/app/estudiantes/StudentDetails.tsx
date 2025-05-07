'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import '~/styles/ia.css';
import '~/styles/searchBar.css';
import '~/styles/uiverse-button.css';

import Image from 'next/image';
import Link from 'next/link';

import { StarIcon } from '@heroicons/react/24/solid';

import { StudentArtieIa } from '~/components/estudiantes/layout/studentdashboard/StudentArtieIa';
import StudentChatbot from '~/components/estudiantes/layout/studentdashboard/StudentChatbot';
import StudentGradientText from '~/components/estudiantes/layout/studentdashboard/StudentGradientText';
import { StudentProgram } from '~/components/estudiantes/layout/studentdashboard/StudentProgram';
import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Badge } from '~/components/estudiantes/ui/badge';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/estudiantes/ui/card';
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
	const [searchBarDisabled, setSearchBarDisabled] = useState<boolean>(false);
	const [lastSearchQuery, setLastSearchQuery] = useState<string>('');

	const searchInitiated = useRef<boolean>(false);
	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const [isTransitioning, setIsTransitioning] = useState(false);

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

	// Modify the effect to properly handle search bar state
	useEffect(() => {
		setSearchBarDisabled(searchInProgress);
	}, [searchInProgress]);

	const handleSearchComplete = useCallback(() => {
		setSearchInProgress(false);
	}, []);

	// Update handleSearch to properly handle the query
	const handleSearch = useCallback(
		(e?: React.FormEvent) => {
			e?.preventDefault();

			const trimmedQuery = searchQuery.trim();

			if (searchBarDisabled || !trimmedQuery || searchInitiated.current) return;

			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
				searchTimeoutRef.current = null;
			}

			setSearchInProgress(true);
			setShowChatbot(false);
			searchInitiated.current = true;

			const currentQuery = trimmedQuery; // Store the current query

			searchTimeoutRef.current = setTimeout(() => {
				setShowChatbot(true);
				setChatbotKey((prev) => prev + 1);

				// Use the stored query when showing the chatbot
				setLastSearchQuery(currentQuery);

				// Clear search bar after ensuring query is passed
				setTimeout(() => {
					setSearchQuery('');
					setSearchInProgress(false);
				}, 100);
			}, 300);
		},
		[searchQuery, searchBarDisabled]
	);

	// Update handleSearchChange to not clear chatbot when clearing searchbar
	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value;
			setSearchQuery(newValue);

			// Only reset search progress if there's no query
			if (!newValue.trim()) {
				setSearchInProgress(false);
				searchInitiated.current = false;
			}
		},
		[]
	);

	// Slide interval effect with cleanup
	useEffect(() => {
		const interval = setInterval(() => {
			if (!isTransitioning) {
				setIsTransitioning(true);
				setCurrentSlide((prevSlide) => {
					const nextSlide = (prevSlide + 1) % latestFiveCourses.length;
					return nextSlide;
				});

				// Reset transitioning state after animation completes
				setTimeout(() => {
					setIsTransitioning(false);
				}, 500);
			}
		}, 8000);

		return () => clearInterval(interval);
	}, [latestFiveCourses.length, isTransitioning]);

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

	const getPlaceholderText = () => {
		if (typeof window !== 'undefined') {
			return window.innerWidth <= 768
				? 'Escribe tu Idea...?'
				: 'Que Deseas Crear? Escribe Tu Idea...';
		}
		return 'Que Deseas Crear? Escribe Tu Idea...';
	};

	const getImageUrl = (imageKey: string | null | undefined) => {
		if (!imageKey || imageKey === 'NULL') {
			return 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';
		}
		const s3Url = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${imageKey}`;
		return `/api/image-proxy?url=${encodeURIComponent(s3Url)}`;
	};

	return (
		<div className="-mb-8 flex min-h-screen flex-col sm:mb-0">
			<main className="grow">
				<div className="container mx-auto">
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
											className={`input ${searchBarDisabled ? 'cursor-not-allowed opacity-70' : ''}`}
											name="search"
											placeholder={
												searchBarDisabled
													? 'Procesando consulta...'
													: getPlaceholderText()
											}
											type="search"
											value={searchQuery}
											onChange={handleSearchChange}
											disabled={searchBarDisabled}
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
									className={`absolute inset-0 transform transition-all duration-500 ${
										index === currentSlide
											? 'translate-x-0 opacity-100'
											: 'translate-x-full opacity-0'
									}`}
								>
									<div className="relative size-full">
										<Image
											src={getImageUrl(course.coverImageKey)}
											alt={course.title}
											fill
											className="object-cover"
											priority={index === currentSlide}
											sizes="100vw"
											quality={75}
										/>
									</div>
									<div className="text-primary absolute inset-0 flex items-center justify-start bg-black/50 p-4">
										<div
											className="ml-8 w-[400px] max-w-[90%] rounded-xl bg-white/10 p-6 backdrop-blur-md"
											style={{
												boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
												border: '1px solid rgba(255, 255, 255, 0.18)',
											}}
										>
											<h2 className="mb-2 line-clamp-3 text-3xl font-semibold sm:mb-4 sm:text-4xl">
												{course.title}
											</h2>
											<Badge
												variant="outline"
												className="border-primary text-primary mb-2"
											>
												{course.category?.name ?? 'Sin categoría'}
											</Badge>
											<p className="mb-2 line-clamp-2 text-sm sm:text-base">
												{truncateDescription(course.description ?? '', 150)}
											</p>
											<p className="mb-1 text-sm font-bold sm:text-base">
												Educador: {course.instructorName}
											</p>
											<p className="mb-1 text-sm font-bold text-red-500 sm:text-base">
												{course.modalidad?.name ?? 'Modalidad no especificada'}
											</p>
											<div className="mb-4 flex items-center">
												<StarIcon className="size-4 text-yellow-500 sm:size-5" />
												<span className="ml-1 text-sm text-yellow-500 sm:text-base">
													{(course.rating ?? 0).toFixed(1)}
												</span>
											</div>
											<Link href={`/estudiantes/cursos/${course.id}`}>
												<button className="uiverse">
													<div className="wrapper">
														<span className='text-black'>Ir al Curso</span>
														<div className="circle circle-12" />
														<div className="circle circle-11" />
														<div className="circle circle-10" />
														<div className="circle circle-9" />
														<div className="circle circle-8" />
														<div className="circle circle-7" />
														<div className="circle circle-6" />
														<div className="circle circle-5" />
														<div className="circle circle-4" />
														<div className="circle circle-3" />
														<div className="circle circle-2" />
														<div className="circle circle-1" />
													</div>
												</button>
											</Link>
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
									<CarouselContent className="-ml-2 md:-ml-4">
										{latestTenCourses.map((course) => (
											<CarouselItem
												key={course.id}
												className="basis-full pl-2 sm:basis-1/2 md:pl-4 lg:basis-1/3"
											>
												<Card className="overflow-hidden border-none bg-transparent shadow-none">
													<div className="relative">
														<AspectRatio ratio={4 / 3}>
															<Image
																src={getImageUrl(course.coverImageKey)}
																alt={course.title}
																fill
																className="rounded-t-xl object-cover"
																sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
																quality={85}
																placeholder="blur"
																blurDataURL={blurDataURL}
																onError={(e) => {
																	const img = e.target as HTMLImageElement;
																	img.src =
																		'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';
																}}
															/>
														</AspectRatio>
													</div>
													<div className="relative rounded-b-xl bg-black/50 backdrop-blur-sm">
														<CardHeader className="p-4">
															<Link href={`/estudiantes/cursos/${course.id}`}>
																<CardTitle className="line-clamp-2 min-h-[2.5rem] text-sm font-bold text-white hover:underline active:scale-95 sm:text-lg">
																	{course.title}
																</CardTitle>
															</Link>
															<Badge
																variant="outline"
																className="border-primary bg-background text-primary line-clamp-1 w-fit text-[8px] sm:text-sm"
															>
																{course.category?.name}
															</Badge>
														</CardHeader>
														<CardContent className="p-4 pt-0">
															<div className="flex items-center justify-between">
																<p className="text-primary line-clamp-1 text-xs font-semibold italic sm:text-base">
																	<span className="whitespace-nowrap">
																		Educador: {course.instructorName}
																	</span>
																</p>
															</div>
														</CardContent>
														<CardFooter className="p-4 pt-0">
															<div className="flex w-full items-center justify-between">
																<span className="text-right text-[8px] font-bold whitespace-pre-line text-red-500 sm:text-base sm:whitespace-normal">
																	{course.modalidad?.name}
																</span>
																<div className="flex items-center">
																	<StarIcon className="size-4 text-yellow-500 sm:size-5" />
																	<span className="ml-1 text-sm font-bold text-yellow-500 sm:text-base">
																		{(course.rating ?? 0).toFixed(1)}
																	</span>
																</div>
															</div>
														</CardFooter>
													</div>
												</Card>
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
				key={chatbotKey}
				className="animation-delay-400 animate-zoom-in fixed"
				initialSearchQuery={lastSearchQuery || searchQuery.trim()} // Use lastSearchQuery if available
				onSearchComplete={handleSearchComplete}
			/>
		</div>
	);
}
