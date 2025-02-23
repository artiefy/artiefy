'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import {
	BookOpen,
	Users,
	Clock,
	GraduationCap,
	Calendar,
	Trophy,
	Star,
	ChevronDown,
} from 'lucide-react';
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
	createdAt: string;
	updatedAt: string;
	requerimientos: string;
	duration: string;
	completionRate: number;
	rating: number;
	modules: {
		title: string;
		progress: number;
		completed: boolean;
	}[];
	upcomingSessions: {
		title: string;
		date: string;
		duration: string;
	}[];
	lessons: {
		title: string;
		coverImageKey: string;
		duration: number;
		description: string;
	}[];
	totalStudents: number;
}

function App() {
	const { user } = useUser();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [autoChangeEnabled, setAutoChangeEnabled] = useState(true);
	const [pauseTimeRemaining, setPauseTimeRemaining] = useState(0);
	const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
	const [courses, setCourses] = useState<Course[]>([]);

	const fetchCourses = useCallback(async () => {
		if (!user) return;
		try {
			const response = await fetch(`/api/educadores/courses?userId=${user.id}`);

			if (response.ok) {
				const data = (await response.json()) as Course[];
				console.log('Cursos cargados:', data);
				setCourses(data);
				setSelectedCourse(data[0] || null);
			} else {
				const errorData = (await response.json()) as { error?: string };
				const errorMessage = errorData.error ?? response.statusText;
				toast({
					title: 'Error',
					description: `No se pudieron cargar los cursos: ${errorMessage}`,
					variant: 'destructive',
				});
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';
			toast({
				title: 'Error',
				description: `No se pudieron cargar los cursos: ${errorMessage}`,
				variant: 'destructive',
			});
		}
	}, [user]);

	const fetchLessons = useCallback(
		async (courseId: number) => {
			try {
				const response = await fetch(
					`/api/educadores/courses?courseId=${courseId}`
				);
				if (response.ok) {
					const data = (await response.json()) as {
						lessons: Course['lessons'];
					};
					setSelectedCourse((prevCourse) =>
						prevCourse ? { ...prevCourse, lessons: data.lessons } : null
					);
				} else {
					const errorData = (await response.json()) as { error?: string };
					const errorMessage = errorData.error ?? response.statusText;
					toast({
						title: 'Error',
						description: `No se pudieron cargar las lecciones: ${errorMessage}`,
						variant: 'destructive',
					});
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				toast({
					title: 'Error',
					description: `No se pudieron cargar las lecciones: ${errorMessage}`,
					variant: 'destructive',
				});
			}
		},
		[user]
	);

	const totalDuracion =
		selectedCourse?.lessons?.reduce(
			(acc, lesson) => acc + lesson.duration,
			0
		) ?? 0;

	useEffect(() => {
		if (user) {
			fetchCourses().catch((error) =>
				console.error('Error fetching courses:', error)
			);
		}
	}, [user, fetchCourses]);

	useEffect(() => {
		if (selectedCourse) {
			fetchLessons(selectedCourse.id).catch((error) =>
				console.error('Error fetching lessons:', error)
			);
		}
	}, [user, selectedCourse, fetchLessons]);

	// Función para cambiar al siguiente curso
	const moveToNextCourse = useCallback(() => {
		if (!autoChangeEnabled || !selectedCourse) return;
		setSelectedCourse((current) => {
			const currentIndex = courses.findIndex(
				(course) => course.id === current?.id
			);
			const nextIndex = (currentIndex + 1) % courses.length;
			return courses[nextIndex];
		});
	}, [autoChangeEnabled, selectedCourse, courses]);

	// Efecto para el cambio automático
	useEffect(() => {
		const interval = setInterval(moveToNextCourse, 5000);
		return () => clearInterval(interval);
	}, [moveToNextCourse]);

	// Efecto para la cuenta regresiva de la pausa
	useEffect(() => {
		if (pauseTimeRemaining > 0) {
			const interval = setInterval(() => {
				setPauseTimeRemaining((time) => {
					if (time <= 1) {
						setAutoChangeEnabled(true);
						return 0;
					}
					return time - 1;
				});
			}, 1000);
			return () => clearInterval(interval);
		}
	}, [pauseTimeRemaining]);

	// Manejador de selección de curso
	const handleCourseSelect = (course: Course) => {
		setSelectedCourse(course);
		setIsDropdownOpen(false);
		setAutoChangeEnabled(false);
		setPauseTimeRemaining(30);
	};

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
									<span className="text-primary">Artiefy</span> Panel de control
								</h1>
							</div>
						</div>
					</div>
				</header>

				{/* Main Content */}
				<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
					{/* Course Selector */}
					<div className="relative mb-6">
						<button
							onClick={() => setIsDropdownOpen(!isDropdownOpen)}
							className="flex w-full justify-between rounded-lg bg-white p-4 shadow-md transition-colors hover:bg-gray-50"
						>
							<div>
								<h2 className="justify-start text-2xl font-bold text-gray-900">
									Curso: {selectedCourse?.title ?? 'Selecciona un curso'}
								</h2>
								<p className="mt-1 text-gray-600">
									Descripcion:{' '}
									{selectedCourse?.description ?? 'Descripción del curso'}
								</p>
								{!autoChangeEnabled && pauseTimeRemaining > 0 && (
									<p className="mt-1 text-sm text-gray-500">
										Cambio automático pausado (se reanudará en{' '}
										{pauseTimeRemaining}s)
									</p>
								)}
							</div>
							<ChevronDown
								className={`size-6 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
							/>
						</button>

						{isDropdownOpen && (
							<div className="absolute inset-x-0 top-full z-10 mt-2 max-h-64 overflow-auto rounded-lg bg-white shadow-lg">
								{courses.map((course) => (
									<button
										key={course.id}
										onClick={() => handleCourseSelect(course)}
										className="w-full px-4 py-3 text-left transition-colors hover:bg-gray-50"
									>
										<h3 className="font-semibold text-gray-900">
											Curso: {course.title}
										</h3>
										<p className="text-sm text-gray-600">
											Descripcion: {course.description}
										</p>
									</button>
								))}
							</div>
						)}
					</div>

					{/* Stats Grid */}
					{selectedCourse && (
						<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
							<StatCard
								icon={<Users className="size-6" />}
								title="Total estudiantes"
								value={selectedCourse.totalStudents?.toString() ?? 'N/A'}
							/>
							<StatCard
								icon={<Clock className="size-6" />}
								title="Duracion del cursos (minutos)"
								value={totalDuracion.toString()}
							/>
							<StatCard
								icon={<Trophy className="size-6" />}
								title="Rango de completacion"
								value={`${selectedCourse.completionRate}%`}
							/>
							<StatCard
								icon={<Star className="size-6" />}
								title="Average Rating"
								value={`${selectedCourse.rating}/5`}
								trend="Basado en la retroalimentacion de los estudiantes"
							/>
						</div>
					)}

					{/* Course Details */}
					{selectedCourse && (
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
							{/* Main Content Section */}
							<div className="lg:col-span-2">
								<div className="rounded-lg bg-white p-6 shadow-md">
									<h3 className="mb-4 text-lg font-semibold text-gray-900">
										Progreso del curso: {selectedCourse.title}
									</h3>
									<div className="space-y-4">
										{selectedCourse.lessons?.map((lesson, index) => (
											<ProgressModule
												key={index}
												title={lesson.title}
												// progress={lesson.progress}
												// completed={lesson.completed}
											/>
										)) ?? <p>No modules available.</p>}
									</div>
								</div>
							</div>

							{/* Sidebar */}
							<div className="space-y-6">
								<div className="rounded-lg bg-white p-6 shadow-md">
									<h3 className="mb-4 text-lg font-semibold text-gray-900">
										Upcoming Sessions
									</h3>
									<div className="space-y-4">
										{selectedCourse.upcomingSessions?.map((session, index) => (
											<UpcomingSession
												key={index}
												title={session.title}
												date={session.date}
												duration={session.duration}
											/>
										)) ?? <p>No upcoming sessions available.</p>}
									</div>
								</div>

								<div className="rounded-lg bg-white p-6 shadow-md">
									<h3 className="mb-4 text-lg font-semibold text-gray-900">
										Resources
									</h3>
									<div className="space-y-3">
										<ResourceLink title="Course Materials" count={24} />
										<ResourceLink title="Video Lectures" count={36} />
										<ResourceLink title="Practice Exercises" count={48} />
										<ResourceLink title="Additional Reading" count={12} />
									</div>
								</div>
							</div>
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

interface ProgressModuleProps {
	title: string;
	// progress: number;
	// completed: boolean;
}

function ProgressModule({ title }: ProgressModuleProps) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium text-gray-900">
					Clase: {title}
				</span>
				{/* <span className="text-sm text-gray-500">{progress}%</span> */}
			</div>
			<div className="h-2 overflow-hidden rounded-full bg-gray-200">
				<div
					className={`h-full rounded-full`}
					// style={{ width: `${progress}%` }}
					// ${completed ? 'bg-green-500' : 'bg-primary'}
				/>
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

function ResourceLink({ title, count }: { title: string; count: number }) {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center">
				<BookOpen className="size-4 text-primary" />
				<span className="ml-2 text-sm text-gray-700">{title}</span>
			</div>
			<span className="text-sm text-gray-500">{count}</span>
		</div>
	);
}

export default App;
