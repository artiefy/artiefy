import { currentUser } from '@clerk/nextjs/server';
import {
	ArrowRightCircleIcon,
	StarIcon,
	CheckCircleIcon,
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import PaginationContainer from '~/components/estudiantes/layout/PaginationContainer';
import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Badge } from '~/components/estudiantes/ui/badge';
import { Button } from '~/components/estudiantes/ui/button';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/estudiantes/ui/card';
import { getImagePlaceholder } from '~/lib/plaiceholder';
import { isUserEnrolled } from '~/server/actions/estudiantes/courses/enrollInCourse';
import type { Course } from '~/types';

interface CourseListStudentProps {
	courses: Course[];
	currentPage: number;
	totalPages: number;
	totalCourses: number;
	category?: string;
	searchTerm?: string;
}

export default async function CourseListStudent({
	courses,
	currentPage,
	totalPages,
	totalCourses,
	category,
	searchTerm,
}: CourseListStudentProps) {
	const user = await currentUser();
	const userId = user?.id;

	if (!courses || courses.length === 0) {
		return <div>No hay cursos disponibles</div>;
	}

	return (
		<>
			<h2 className="my-6 ml-8 text-3xl font-bold text-primary lg:ml-20">
				Cursos Artie
			</h2>
			<div className="mb-8 grid grid-cols-1 gap-4 px-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-20">
				{await Promise.all(
					courses.map(async (course) => {
						let imageUrl =
							'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';
						let blurDataURL;
						try {
							if (course.coverImageKey && course.coverImageKey !== 'NULL') {
								imageUrl =
									`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`.trimEnd();
								blurDataURL = await getImagePlaceholder(imageUrl);
							}
						} catch (error) {
							console.error('Error fetching image from AWS S3:', error);
							blurDataURL = undefined;
						}

						let isEnrolled = false;
						try {
							isEnrolled = userId
								? await isUserEnrolled(course.id, userId)
								: false;
						} catch (error) {
							console.error('Error checking enrollment status:', error);
						}

						return (
							<div key={course.id} className="group relative">
								<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-linear-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur-sm transition duration-500 group-hover:opacity-100"></div>
								<Card className="relative flex h-full flex-col justify-between overflow-hidden border-0 bg-gray-800 text-white transition-transform duration-300 ease-in-out zoom-in hover:scale-[1.02]">
									<CardHeader className="">
										<AspectRatio ratio={16 / 9}>
											<div className="relative size-full">
												<Image
													src={imageUrl}
													alt={course.title || 'Imagen del curso'}
													className="rounded-md object-cover transition-transform duration-300 hover:scale-105"
													fill
													{...(blurDataURL
														? { placeholder: 'blur', blurDataURL }
														: {})}
													sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
													quality={75}
												/>
											</div>
										</AspectRatio>
									</CardHeader>

									<CardContent className="-mt-3 flex grow flex-col justify-between space-y-2">
										<CardTitle className="rounded text-lg text-background">
											<div className="font-bold text-primary">
												{course.title}
											</div>
										</CardTitle>
										<div className="flex items-center justify-between">
											<Badge
												variant="outline"
												className="border-primary bg-background text-primary hover:bg-black/70"
											>
												{course.category?.name}
											</Badge>
											{isEnrolled && (
												<div className="flex items-center text-green-500">
													<CheckCircleIcon className="size-5" />
													<span className="ml-1 text-sm font-bold">
														Inscrito
													</span>
												</div>
											)}
										</div>
										<p className="line-clamp-2 text-sm text-gray-300">
											{course.description}
										</p>
									</CardContent>
									<CardFooter className="flex flex-col items-start justify-between space-y-2">
										<div className="flex w-full justify-between">
											<p className="text-sm font-bold text-gray-300 italic">
												Educador:{' '}
												<span className="font-bold italic">
													{course.instructor}
												</span>
											</p>
											<p className="text-sm font-bold text-red-500">
												{course.modalidad?.name}
											</p>
										</div>
										<div className="flex w-full items-center justify-between">
											<Button asChild>
												<Link
													href={`/estudiantes/cursos/${course.id}`}
													className="group/button relative inline-flex h-10 items-center justify-center overflow-hidden rounded-md border border-white/20 bg-background p-2 text-primary active:scale-95"
												>
													<p className="font-bold">Ver Curso</p>
													<ArrowRightCircleIcon className="animate-bounce-right mr-2 ml-1 size-5" />
													<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
														<div className="relative h-full w-10 bg-white/30"></div>
													</div>
												</Link>
											</Button>
											<div className="flex items-center">
												<StarIcon className="size-5 text-yellow-500" />
												<span className="ml-1 text-sm font-bold text-yellow-500">
													{(course.rating ?? 0).toFixed(1)}
												</span>
											</div>
										</div>
									</CardFooter>
								</Card>
							</div>
						);
					})
				)}
			</div>
			<PaginationContainer
				totalPages={totalPages}
				currentPage={currentPage}
				totalCourses={totalCourses}
				route="/estudiantes"
				category={category}
				searchTerm={searchTerm}
			/>
		</>
	);
}
