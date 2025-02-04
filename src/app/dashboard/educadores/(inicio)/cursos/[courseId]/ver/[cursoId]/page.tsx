'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { StarIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FaCalendar, FaClock, FaUserGraduate } from 'react-icons/fa';
import { Badge } from '~/components/educators/ui/badge';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
	BreadcrumbPage,
} from '~/components/educators/ui/breadcrumb';
import { Card, CardHeader, CardTitle } from '~/components/educators/ui/card';
import { toast } from '~/hooks/use-toast';

interface Course {
	id: number;
	title: string;
	description: string;
	categoryid: string;
	dificultadid: string;
	modalidadesid: string;
	instructor: string;
	rating: number;
	coverImageKey: string;
	creatorId: string;
	createdAt: string;
	updatedAt: string;
	requerimientos: string;
	totalStudents: number;
}
interface CourseDetailProps {
	courseId: number;
}

interface LessonsModels {
	id: number;
	title: string;
	coverImageKey: string | null;
	coverVideoKey: string | null;
	resourceKey: string | null;
	description: string;
	createdAt: string;
	updatedAt: string;
	duration: number;
	order: number;
	course: {
		id: number;
		title: string;
		description: string;
		instructor: string;
	};
}

const getContrastYIQ = (hexcolor: string) => {
	if (!hexcolor) return 'black'; // Manejar el caso de color indefinido
	hexcolor = hexcolor.replace('#', '');
	const r = parseInt(hexcolor.substr(0, 2), 16);
	const g = parseInt(hexcolor.substr(2, 2), 16);
	const b = parseInt(hexcolor.substr(4, 2), 16);
	const yiq = (r * 299 + g * 587 + b * 114) / 1000;
	return yiq >= 128 ? 'black' : 'white';
};

const formatDate = (dateString: string | number | Date) => {
	const date = new Date(dateString);
	return isNaN(date.getTime())
		? 'Fecha inválida'
		: date.toISOString().split('T')[0];
};

const CourseDetail: React.FC<CourseDetailProps> = () => {
	const { user } = useUser();
	const params = useParams();
	const courseIdUrl = params?.courseId;
	const [course, setCourse] = useState<Course | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [lessons, setLessons] = useState<LessonsModels[]>([]);
	const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
	const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');

	// Verifica que courseId no sea un array ni undefined, y lo convierte a número
	const courseIdString = Array.isArray(courseIdUrl)
		? courseIdUrl[0]
		: courseIdUrl;
	const courseIdString2 = courseIdString ?? '';
	const courseIdNumber = parseInt(courseIdString2);

	const fetchCourse = useCallback(async () => {
		if (!user) return;
		if (courseIdNumber !== null) {
			try {
				setLoading(true);
				setError(null);
				const response = await fetch(
					`/api/educadores/courses/${courseIdNumber}`
				);

				if (response.ok) {
					const data = (await response.json()) as Course;
					console.log(data);
					setCourse(data);
				} else {
					const errorData = (await response.json()) as { error?: string };
					const errorMessage = errorData.error ?? response.statusText;
					setError(`Error al cargar el curso: ${errorMessage}`);
					toast({
						title: 'Error',
						description: `No se pudo cargar el curso: ${errorMessage}`,
						variant: 'destructive',
					});
				}
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : 'Error desconocido';
				setError(`Error al cargar el curso: ${errorMessage}`);
				toast({
					title: 'Error',
					description: `No se pudo cargar el curso: ${errorMessage}`,
					variant: 'destructive',
				});
			} finally {
				setLoading(false);
			}
		}
	}, [user, courseIdNumber]);

	useEffect(() => {
		fetchCourse().catch((error) =>
			console.error('Error fetching course:', error)
		);
	}, [fetchCourse]);

	// Fetch de las lecciones cuando el courseId cambia
	useEffect(() => {
		if (course?.id) {
			const fetchLessons = async () => {
				setLoading(true);
				setError(null);
				try {
					const response = await fetch(
						`/api/educadores/lessons?courseId=${course.id}`
					);

					if (!response.ok) {
						const errorData = (await response.json()) as { error?: string };
						throw new Error(
							errorData.error ?? 'Error al obtener las lecciones'
						);
					}

					const data = (await response.json()) as LessonsModels[];
					setLessons(data); // Setea las lecciones obtenidas
				} catch (error) {
					setError('Error al obtener las lecciones'); // Error general
					console.error('Error al obtener las lecciones:', error);
				} finally {
					setLoading(false);
				}
			};

			void fetchLessons();
		}
	}, [course?.id]); // Este efecto se ejecuta cada vez que el courseId cambia

	const toggleLesson = (lessonId: number) => {
		setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
	};

	const navigateToLesson = (lessonId: number) => {
		window.location.href = `/dashboard/educadores/cursos/${courseIdNumber}/lecciones/${lessonId}`;
	};

	useEffect(() => {
		const savedColor = localStorage.getItem(`selectedColor_${courseIdNumber}`);
		if (savedColor) {
			setSelectedColor(savedColor);
		}
		console.log(`Color guardado ${savedColor}`);
	}, [courseIdNumber]);

	if (loading) return <div>Cargando curso...</div>;
	if (error) return <div>Error: {error}</div>;
	if (!course) return <div>No se encontró el curso.</div>;

	return (
		<div className="h-auto w-full rounded-lg bg-background">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink
							className="hover:text-gray-300"
							href="/dashboard/educadores"
						>
							Inicio
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="hover:text-gray-300"
							href="/dashboard/educadores/cursos"
						>
							Lista de cursos
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							href="#"
							onClick={() => window.history.back()}
							className="transition duration-300 hover:scale-105 hover:text-gray-300"
						>
							Detalles curso:
							{course.title}
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>Vista estudiante</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage className="hover:text-gray-300">
							Detalles curso:
							{course.title}
						</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<div className="group relative h-auto w-full">
				<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100"></div>
				<Card
					className={`relative z-20 mt-3 h-auto overflow-hidden border-none bg-black p-4 text-white transition-transform duration-300 ease-in-out zoom-in`}
					style={{
						backgroundColor: selectedColor,
						color: getContrastYIQ(selectedColor),
					}}
				>
					<CardHeader className="grid w-full grid-cols-2 justify-evenly md:gap-32 lg:gap-60">
						<CardTitle
							className={`text-2xl font-bold hover:underline ${
								selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
							}`}
						>
							Curso: {course.title}
						</CardTitle>
					</CardHeader>
					<div className={`flex flex-col`}>
						{/* Columna izquierda - Imagen */}
						<div className="h-96 w-full">
							<Image
								src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
								alt={course.title}
								width={300}
								height={100}
								className="mx-auto rounded-lg object-cover"
								priority
								quality={75}
							/>
						</div>
						{/* Columna derecha - Información */}
						<div className="pb-6">
							<div>
								<div className="my-4 flex justify-between">
									<div className="flex flex-col">
										<h2
											className={`font-semibold ${
												selectedColor === '#FFFFFF'
													? 'text-black'
													: 'text-white'
											}`}
										>
											Educador:
										</h2>
										<p
											className={
												selectedColor === '#FFFFFF'
													? 'text-black'
													: 'text-white'
											}
										>
											{course.instructor}
										</p>
									</div>
									<div className="flex gap-4">
										<p
											className={`flex ${
												selectedColor === '#FFFFFF'
													? 'text-black'
													: 'text-white'
											}`}
										>
											<FaUserGraduate className="mr-2 text-blue-600" />
											{course.totalStudents} Estudiantes
										</p>
										<p>Rating</p>

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
								<div className="flex space-x-3">
									<div>
										<Badge
											variant="outline"
											className="border-primary bg-background text-primary hover:bg-black/70"
										>
											{course.categoryid}
										</Badge>
									</div>
									<div className="flex items-center">
										<FaCalendar className="mr-2 text-gray-600" />
										<p>{formatDate(course.createdAt)}</p>
									</div>
									<div className="flex items-center">
										<FaClock className="mr-2 text-gray-600" />
										Última actualización: {formatDate(course.updatedAt)}
									</div>
								</div>
							</div>
							<div className="my-4">
								<h2
									className={`text-lg font-semibold ${
										selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
									}`}
								>
									Descripción:
								</h2>
								<p
									className={`text-justify ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'}`}
								>
									{course.description}
								</p>
							</div>
							<div className="grid grid-cols-2">
								<div className="flex flex-col">
									<h2
										className={`text-lg font-semibold ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Dificultad:
									</h2>
									<p
										className={
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}
									>
										{course.dificultadid}
									</p>
								</div>
								<div className="flex flex-col">
									<h2
										className={`text-lg font-semibold ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Modalidad:
									</h2>
									<p
										className={
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}
									>
										{course.modalidadesid}
									</p>
								</div>
							</div>
							<div className="mt-6 text-2xl font-bold">
								Clases del curso
								<div className="space-y-4">
									{lessons
										.sort((a, b) => a.order - b.order)
										.map((lesson) => {
											return (
												<div
													key={lesson.id}
													className={`overflow-hidden rounded-lg border transition-colors`}
												>
													<button
														className="flex w-full items-center justify-between px-6 py-4"
														onClick={() => toggleLesson(lesson.id)}
													>
														<div className="flex w-full items-center justify-between">
															<div
																className={`flex items-center space-x-2 ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'}`}
															>
																<span className="font-medium">
																	Clase {lesson.order}: {lesson.title}{' '}
																	<span className="ml-2 text-sm">
																		({lesson.duration} mins)
																	</span>
																</span>
															</div>
															<div className="flex items-center space-x-2"></div>
														</div>
													</button>
													{expandedLesson === lesson.id && (
														<div
															className={`px-6 py-4 ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'}`}
														>
															<p className="text-sm">
																Del Educador: {lesson.course.instructor}
															</p>
															<p className="text-sm">
																Descripción: {lesson.description}
															</p>
															<p className="mb-4 text-sm">
																Fecha de creación:{' '}
																{formatDate(lesson.createdAt)}
															</p>
															<Link
																className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-700"
																href={`/dashboard/educadores/cursos/${courseIdNumber}/${lesson.id}/verClase/${lesson.id}`}
															>
																Ir a la clase
															</Link>
														</div>
													)}
												</div>
											);
										})}
								</div>
							</div>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
};

export default CourseDetail;
