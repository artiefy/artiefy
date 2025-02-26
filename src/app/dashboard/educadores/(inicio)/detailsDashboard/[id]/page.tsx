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
	const [courses, setCourses] = useState<Course | null>(null);
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
				prevCourses ? { ...prevCourses, lessons: updatedLessons } : null
			);
		} catch (error) {
			console.error('Error fetching user progress:', error);
			toast({
				title: 'Error',
				description: `No se pudo obtener el progreso del usuario: ${error instanceof Error ? error.message : 'Unknown error'}`,
				variant: 'destructive',
			});
		}
	}, [courseIdNumber, fetchCourses]);

	useEffect(() => {
		if (user && courseIdNumber) {
			fetchCourses().catch((error) =>
				console.error('Error fetching courses:', error)
			);
		}
	}, [user, courseIdNumber, fetchCourses]);

	useEffect(() => {
		if (user && courses) {
			fetchUserProgress().catch((error) =>
				console.error('Error fetching user progress:', error)
			);
		}
	}, [user, fetchUserProgress, courses]);

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
							href="/"
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
			<div className="mt-2 min-h-screen rounded-lg bg-gray-50/5">
				{/* Header */}
				<header className="rounded-md bg-white shadow-sm">
					<div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between">
							<div className="flex items-center">
								<GraduationCap className="size-8 text-primary" />
								<h1 className="ml-2 text-2xl font-bold text-gray-900">
									<span className="text-primary">
										Panel de control del curso:
									</span>{' '}
									{courses?.title}
								</h1>
							</div>
						</div>
					</div>
				</header>
				{/* Main Content */}
				<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
					<div className="relative mb-6 rounded-lg bg-white p-4 shadow-md">
						<div>
							<h2 className="justify-start text-2xl font-bold text-gray-900">
								Curso: {courses?.title ?? 'Selecciona un curso'}
							</h2>
							<p className="mt-1 text-gray-600">
								Descripcion: {courses?.description ?? 'Descripción del curso'}
							</p>
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
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
							{/* Lessons List */}
							<div className="rounded-lg bg-white shadow-md lg:col-span-2">
								<h3 className="my-2 ml-4 text-xl font-semibold text-gray-900">
									Progreso de las Lecciones
								</h3>
								<ul className="space-y-4">
									{courses.lessons.map((lesson) => (
										<li
											key={lesson.id}
											className="rounded-lg bg-white p-4 shadow-md"
										>
											<h4 className="text-sm font-semibold text-gray-900">
												{lesson.title}
											</h4>
											<div className="flex justify-between">
												<div>
													<p className="text-sm text-gray-600">
														Duración: {lesson.duration} minutos
													</p>
												</div>
												<div>
													<p className="text-sm text-gray-600">
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
							{courses.modalidadesid && (
								<div className="space-y-6">
									<div className="rounded-lg bg-white p-6 shadow-md">
										<h3 className="mb-4 text-lg font-semibold text-gray-900">
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
		<div className="rounded-lg bg-white p-6 shadow-md">
			<div className="flex items-center">
				<div className="rounded-lg bg-primary/10 p-2">
					{React.cloneElement(icon, { className: 'h-6 w-6 text-primary' })}
				</div>
				<div className="ml-4">
					<p className="text-sm font-medium text-gray-600">{title}</p>
					<p className="text-2xl font-semibold text-gray-900">{value}</p>
					{trend && <p className="text-sm text-gray-500">{trend}</p>}
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
		<div className="flex items-start space-x-4">
			<Calendar className="size-5 shrink-0 text-primary" />
			<div>
				<p className="text-sm font-medium text-gray-900">{title}</p>
				<p className="text-sm text-gray-500">{date}</p>
				<p className="text-sm text-gray-500">{duration}</p>
			</div>
		</div>
	);
}

export default App;
