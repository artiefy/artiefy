'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import {
	Users,
	Clock,
	GraduationCap,
	Calendar,
	Trophy,
	Star,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import { toast } from '~/hooks/use-toast';

interface Course {
	id: number;
	title: string;
	description: string;
	categoryid: string;
	dificultadid: string;
	modalidadesid: string;
	instructor: string;
	coverImageKey: string;
	creatorId: string;
	totalDuration: number;
	requerimientos: string;
	rating: number;
	upcomingSessions: {
		title: string;
		date: string;
		duration: string;
	}[];
	completionRate: number;
	lessons: {
		id: number;
		title: string;
		coverImageKey: string;
		duration: number;
		description: string;
		progress: number;
		completed: boolean;
	}[];
	totalStudents: number;
	progressLessons: number;
}

function calculateAverageProgress(lessons: Course['lessons']) {
	const totalProgress = lessons.reduce(
		(acc, lesson) => acc + lesson.progress,
		0
	);
	return lessons.length ? totalProgress / lessons.length : 0;
}

async function fetchUserProgressFromAPI(
	courseId: number
): Promise<Record<number, Record<string, number>>> {
	const response = await fetch(
		`/api/educadores/progressUser?courseId=${courseId}`
	);
	if (response.ok) {
		const contentType = response.headers.get('content-type');
		if (contentType?.includes('application/json')) {
			const data = (await response.json()) as Record<
				number,
				Record<string, number>
			>;
			return data;
		} else {
			throw new Error('Respuesta no es JSON');
		}
	} else if (response.status === 204) {
		// No Content
		return {};
	} else {
		const errorText = await response.text();
		throw new Error(`Error fetching user progress: ${errorText}`);
	}
}

function App() {
	const { user } = useUser();
	const params = useParams();
	const courseIdNumber = params?.id ? Number(params.id) : 0;
	const [courses, setCourses] = useState<Course>();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchCourses = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		setError(null);
		try {
			const response = await fetch(
				`/api/educadores/courses?courseId=${courseIdNumber}`
			);
			if (response.ok) {
				const data = (await response.json()) as Course;
				setCourses(data);
			} else {
				const errorData = (await response.json()) as { error?: string };
				const errorMessage = errorData.error ?? response.statusText;
				setError(`Error al cargar los cursos: ${errorMessage}`);
				toast({
					title: 'Error',
					description: `No se pudieron cargar los cursos: ${errorMessage}`,
					variant: 'destructive',
				});
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';
			setError(`Error al cargar los cursos: ${errorMessage}`);
			toast({
				title: 'Error',
				description: `No se pudieron cargar los cursos: ${errorMessage}`,
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	}, [user, courseIdNumber]);

	const fetchUserProgress = useCallback(async () => {
		if (!courses) return;
		try {
			const userProgress: Record<
				number,
				Record<string, number>
			> = await fetchUserProgressFromAPI(courseIdNumber);
			const updatedLessons = courses.lessons.map((lesson) => {
				const lessonProgress = userProgress[lesson.id];
				const averageProgress = lessonProgress
					? Object.values(lessonProgress).reduce((a, b) => a + b, 0) /
						Object.values(lessonProgress).length
					: 0;
				return {
					...lesson,
					progress: averageProgress,
				};
			});
			setCourses((prevCourses) =>
				prevCourses ? { ...prevCourses, lessons: updatedLessons } : prevCourses
			);
		} catch (error) {
			console.error('Error fetching user progress:', error);
			toast({
				title: 'Error',
				description: `No se pudo obtener el progreso del usuario: ${error instanceof Error ? error.message : 'Unknown error'}`,
				variant: 'destructive',
			});
		}
	}, [courseIdNumber, courses]);

	useEffect(() => {
		if (courses && user) {
			fetchUserProgress().catch((error) =>
				console.error('Error fetching user progress:', error)
			);
		}
	}, [courses, user, fetchUserProgress]);

	useEffect(() => {
		if (user && courseIdNumber) {
			fetchCourses().catch((error) =>
				console.error('Error fetching courses:', error)
			);
		}
	}, [user, courseIdNumber, fetchCourses]);

	const averageProgress = courses
		? calculateAverageProgress(courses.lessons)
		: 0;

	if (loading) {
		return (
			<main className="flex h-screen flex-col items-center justify-center">
				<div className="size-32 animate-spin rounded-full border-y-2 border-primary">
					<span className="sr-only"></span>
				</div>
				<span className="text-primary">Cargando...</span>
			</main>
		);
	}

	if (error) {
		return (
			<main className="flex h-screen items-center justify-center">
				<div className="text-center">
					<p className="text-lg font-semibold text-red-500">{error}</p>
					<button
						onClick={fetchCourses}
						className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
					>
						Reintentar
					</button>
				</div>
			</main>
		);
	}

	return (
		<>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary hover:text-gray-300"
							href="/dashboard/educadores"
						>
							Inicio
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary hover:text-gray-300"
							href="/"
						>
							Dashboard curso: {courses?.title}
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
				</BreadcrumbList>
			</Breadcrumb>
			<div className="mt-2 min-h-screen rounded-lg border-0 text-white shadow-lg">
				{/* Header */}
				<div className="group relative">
					<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100"></div>
					<div className="relative flex h-full flex-col overflow-hidden rounded-lg border-0 bg-gray-800 px-2 text-white transition-transform duration-300 ease-in-out zoom-in"></div>
					<div className="relative flex h-auto flex-col overflow-hidden rounded-lg border-0 bg-gray-800 px-6 py-8 text-white transition-transform duration-300 ease-in-out zoom-in">
						<div className="flex items-center justify-between">
							<div className="flex items-center">
								<GraduationCap className="size-8 text-primary" />
								<h1 className="ml-2 text-2xl font-bold text-white">
									<span className="text-primary">
										Panel de control del curso:
									</span>{' '}
									{courses?.title}
								</h1>
							</div>
						</div>
					</div>
				</div>
				{/* Main Content */}
				<main className="mx-auto max-w-7xl px-2 py-8">
					<div className="group relative mb-4">
						<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100"></div>
						<div className="relative flex h-auto flex-col overflow-hidden rounded-lg border-0 bg-gray-800 px-6 py-8 text-white transition-transform duration-300 ease-in-out zoom-in">
							<div>
								<h2 className="justify-start text-2xl font-bold text-white">
									Curso: {courses?.title ?? 'Selecciona un curso'}
								</h2>
								<p className="mt-1 text-gray-500/70">
									Descripcion: {courses?.description ?? 'Descripción del curso'}
								</p>
							</div>
						</div>
					</div>

					{/* Stats Grid */}
					{courses && (
						<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
							<StatCard
								icon={<Users className="size-6" />}
								title="Total estudiantes registrados"
								value={courses.totalStudents?.toString() ?? 'N/A'}
							/>
							<StatCard
								icon={<Clock className="size-6" />}
								title="Duracion del curso (minutos)"
								value={courses.totalDuration.toString() ?? 'N/A'}
							/>
							<StatCard
								icon={<Trophy className="size-6" />}
								title="Promedio de avance"
								value={`${averageProgress.toFixed(2)}%`}
							/>
							<StatCard
								icon={<Star className="size-6" />}
								title="Rating"
								value={`${courses.rating}`}
								trend="Basado en la retroalimentacion de los estudiantes"
							/>
						</div>
					)}

					{/* Course Details */}
					{courses && (
						<div className="flex flex-col justify-between gap-6 lg:flex-row">
							{/* Lessons List */}
							<div className="group relative h-fit w-full">
								<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100"></div>
								<div className="relative flex h-auto flex-col overflow-hidden rounded-lg border-0 bg-gray-800 px-6 py-8 text-white transition-transform duration-300 ease-in-out zoom-in">
									<h3 className="my-2 ml-4 text-xl font-semibold text-white">
										Progreso de las Lecciones
									</h3>
									<ul className="flex flex-col-reverse space-y-4">
										{courses.lessons.map((lesson) => (
											<li
												key={lesson.id}
												className="rounded-lg bg-transparent p-4 shadow-md"
											>
												<h4 className="text-sm font-semibold text-white">
													{lesson.title}
												</h4>
												<div className="flex justify-between">
													<div>
														<p className="text-sm text-gray-400">
															Duración: {lesson.duration} minutos
														</p>
													</div>
													<div>
														<p className="text-sm text-gray-400">
															{lesson.progress !== undefined
																? `${lesson.progress.toFixed(2)}%`
																: 'Sin progreso'}
														</p>
													</div>
												</div>
												<div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
													<div
														className="h-full rounded-full bg-green-500"
														style={{ width: `${lesson.progress ?? 0}%` }}
													/>
												</div>
											</li>
										))}
									</ul>
								</div>
							</div>
							{/* Course Details */}
							{courses.modalidadesid && (
								<div className="group relative h-fit w-1/3">
									<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100"></div>
									<div className="relative flex h-auto flex-col overflow-hidden rounded-lg border-0 bg-gray-800 px-6 py-8 text-gray-400 transition-transform duration-300 ease-in-out zoom-in">
										<div className="space-y-6">
											<h3 className="mb-4 text-lg font-semibold text-white">
												Sesiones del curso
											</h3>
											<div className="space-y-4">
												{courses.upcomingSessions?.map((session, index) => (
													<UpcomingSession
														key={index}
														title={session.title}
														date={session.date}
														duration={session.duration}
													/>
												)) ?? <p>No hay secciones disponibles actualmente.</p>}
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					)}
				</main>
			</div>
		</>
	);
}

interface StatCardProps {
	icon: React.ReactElement<SVGElement>;
	title: string;
	value: string;
	trend?: string; // Hacer que la propiedad trend sea opcional
}

function StatCard({ icon, title, value, trend }: StatCardProps) {
	return (
		<div className="group relative">
			<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100"></div>
			<div className="relative flex h-full flex-col overflow-hidden rounded-lg border-0 bg-gray-800 px-6 py-8 text-white transition-transform duration-300 ease-in-out zoom-in">
				<div className="flex items-center">
					<div className="rounded-lg bg-primary/10 p-2">
						{React.cloneElement(icon, { className: 'h-6 w-6 text-primary' })}
					</div>
					<div className="ml-4">
						<p className="text-sm font-medium text-white">{title}</p>
						<p className="text-2xl font-semibold text-white">{value}</p>
						{trend && <p className="text-sm text-white">{trend}</p>}
					</div>
				</div>
			</div>
		</div>
	);
}

interface UpcomingSessionProps {
	title: string;
	date: string;
	duration: string;
}

function UpcomingSession({ title, date, duration }: UpcomingSessionProps) {
	return (
		<div className="group relative">
			<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100"></div>
			<div className="relative flex h-full flex-col overflow-hidden rounded-lg border-0 bg-gray-800 px-6 py-8 text-white transition-transform duration-300 ease-in-out zoom-in"></div>
			<div className="flex items-start space-x-4">
				<Calendar className="size-5 shrink-0 text-primary" />
				<div>
					<p className="text-sm font-medium text-gray-900">{title}</p>
					<p className="text-sm text-gray-500">{date}</p>
					<p className="text-sm text-gray-500">{duration}</p>
				</div>
			</div>
		</div>
	);
}

export default App;
