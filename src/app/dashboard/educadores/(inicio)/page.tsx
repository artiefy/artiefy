'use client';
import { useCallback, useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { GraduationCap } from 'lucide-react';
import {
	FaBook,
	FaChalkboardTeacher,
	FaClock,
	FaGraduationCap,
} from 'react-icons/fa';
import { toast } from 'sonner';

import CourseListDetails from '~/components/educators/layout/CourseListDetails';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';

// Define the CourseModel interface
export interface CourseModel {
	id: number;
	title: string;
	description: string;
	categoryid: string;
	modalidadesid: string;
	createdAt: string;
	instructor: string;
	coverImageKey: string;
	creatorId: string;
	nivelid: string;
	totalParametros: number; // Add this line
}

// Define the StatsModel interface
export interface StatsModel {
	totalCourses: number;
	totalLessons: number;
	totalEnrollments: number;
	totalDuration: number;
	averageEnrollments: number;
}

export default function Home() {
	const { user } = useUser(); // Get the user from Clerk
	const [courses, setCourses] = useState<CourseModel[]>([]); // Initialize courses state
	const [loading, setLoading] = useState(false); // Initialize loading state
	const [error, setError] = useState<string | null>(null); // Initialize error state
	const [stats, setStats] = useState<StatsModel>({
		totalCourses: 0,
		totalLessons: 0,
		totalEnrollments: 0,
		totalDuration: 0,
		averageEnrollments: 0,
	}); // Initialize stats state "datos del dashboard"

	// Fetch stats
	const fetchStats = useCallback(async () => {
		if (!user) return;
		try {
			// Fetch the stats from the API of dashboard by user Id
			const response = await fetch(
				`/api/educadores/dashboard?userId=${user.id}`
			);
			if (response.ok) {
				const data = (await response.json()) as StatsModel;
				setStats(data);
			} else {
				const errorData = (await response.json()) as { error?: string };
				const errorMessage = errorData.error ?? response.statusText;
				toast('Error', {
					description: `No se pudieron cargar las estadísticas: ${errorMessage}`,
				});
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Error desconocido';
			toast('Error', {
				description: `No se pudieron cargar las estadísticas: ${errorMessage}`,
			});
		}
	}, [user]);

	console.log('stats', stats);

	// Fetch courses
	useEffect(() => {
		if (user) {
			fetchStats().catch((error) =>
				console.error('Error fetching stats:', error)
			);
		}
	}, [user, fetchStats]);

	// Fetch courses
	const fetchCourses = useCallback(async () => {
		if (!user) return;
		try {
			setLoading(true);
			setError(null);
			const response = await fetch(
				`/api/educadores/courses/coursesByEducator?userId=${encodeURIComponent(user.id)}&fullName=${encodeURIComponent(user.fullName ?? '')}`
			);
			console.log('API Response:', response);
			if (response.ok) {
				const data = (await response.json()) as CourseModel[];
				console.log('Courses data:', data);
				setCourses(
					data.map((course) => ({
						...course,
						nivelid: course.nivelid ?? '', // Map it properly
						categoryid: course.categoryid, // Map categoryid properly
						modalidadesid: course.modalidadesid, // Map modalidadesid properly
					})) as CourseModel[]
				);
			} else {
				const errorData = (await response.json()) as { error?: string };
				const errorMessage = errorData.error ?? response.statusText;
				setError(`Error al cargar los cursos: ${errorMessage}`);
				toast('Error', {
					description: `No se pudieron cargar los cursos: ${errorMessage}`,
				});
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Error desconocido';
			setError(`Error al cargar los cursos: ${errorMessage}`);
			toast('Error', {
				description: `No se pudieron cargar los cursos: ${errorMessage}`,
			});
		} finally {
			setLoading(false);
		}
	}, [user]);

	// Fetch courses
	useEffect(() => {
		if (user) {
			fetchCourses().catch((error) =>
				console.error('Error fetching courses:', error)
			);
		}
	}, [user, fetchCourses]);

	// Render the component loading, error or data
	if (loading) {
		return (
			<main className="flex h-screen flex-col items-center justify-center">
				<div className="border-primary size-32 rounded-full border-y-2">
					<span className="sr-only" />
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
						className="bg-primary mt-4 rounded-md px-4 py-2 text-white"
					>
						Reintentar
					</button>
				</div>
			</main>
		);
	}

	// Render the component with the data of dashboard en general
	return (
		<main>
			<Breadcrumb className="mb-4">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary hover:text-gray-300"
							href="../educadores"
						>
							Inicio
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
				</BreadcrumbList>
			</Breadcrumb>
			<div className="group relative">
				<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100" />
				<div className="zoom-in relative flex h-full flex-col overflow-hidden rounded-lg border-0 bg-gray-800 py-4 text-white transition-transform duration-300 ease-in-out">
					<div className="flex w-full rounded-lg px-4 sm:px-6 lg:px-8">
						<GraduationCap className="text-primary h-14 w-12" />
						<div className="ml-4 flex flex-col">
							<h1 className="text-2xl font-bold text-gray-200">
								<span className="text-primary">Artiefy</span> panel de control
							</h1>
							<p className="text-white">
								¡Bienvenido al panel de vuelta, educador: {user?.firstName}!
							</p>
						</div>
					</div>
				</div>
			</div>
			<div className="mx-auto mt-4 max-w-7xl p-4 sm:px-6 lg:px-0">
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{/* Average Grade Card */}
					<div className="group relative">
						<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100" />
						<div className="zoom-in relative flex h-full flex-col overflow-hidden rounded-lg border-0 bg-gray-800 px-2 text-white transition-transform duration-300 ease-in-out">
							<div className="p-5">
								<div className="flex items-center">
									<div className="shrink-0">
										<FaGraduationCap className="size-6 text-[hsl(178.4,89.4%,59.2%)]" />
									</div>
									<div className="ml-5 w-0 flex-1">
										<dl>
											<dt className="truncate text-sm font-medium text-gray-300">
												Promedio estudiantes
											</dt>
											<dd className="flex items-baseline">
												<div className="text-2xl font-semibold text-white">
													{stats.averageEnrollments ?? 0}
												</div>
											</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="group relative">
						<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100" />
						<div className="zoom-in relative flex h-full flex-col overflow-hidden rounded-lg border-0 bg-gray-800 px-2 text-white transition-transform duration-300 ease-in-out">
							<div className="p-5">
								<div className="flex items-center">
									<div className="shrink-0">
										<FaBook className="size-6 text-[hsl(178.4,89.4%,59.2%)]" />
									</div>
									<div className="ml-5 w-0 flex-1">
										<dl>
											<dt className="truncate text-sm font-medium text-gray-200">
												Total de Cursos
											</dt>
											<dd className="flex items-baseline">
												<div className="text-2xl font-semibold text-white">
													{stats.totalCourses ?? 0}
												</div>
											</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="group relative">
						<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100" />
						<div className="zoom-in relative flex h-full flex-col overflow-hidden rounded-lg border-0 bg-gray-800 px-2 text-white transition-transform duration-300 ease-in-out">
							<div className="p-5">
								<div className="flex items-center">
									<div className="shrink-0">
										<FaChalkboardTeacher className="size-6 text-[hsl(178.4,89.4%,59.2%)]" />
									</div>
									<div className="ml-5 w-0 flex-1">
										<dl>
											<dt className="truncate text-sm font-medium text-gray-200">
												Total de Clases
											</dt>
											<dd className="flex items-baseline">
												<div className="text-2xl font-semibold text-white">
													{stats.totalLessons ?? 0}
												</div>
											</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="group relative">
						<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100" />
						<div className="zoom-in relative flex h-full flex-col overflow-hidden rounded-lg border-0 bg-gray-800 px-2 text-white transition-transform duration-300 ease-in-out">
							<div className="p-5">
								<div className="flex items-center">
									<div className="shrink-0">
										<FaClock className="size-6 text-[hsl(178.4,89.4%,59.2%)]" />
									</div>
									<div className="ml-5 w-0 flex-1">
										<dl>
											<dt className="truncate text-sm font-medium text-gray-200">
												Duración total
											</dt>
											<dd className="flex items-baseline">
												<div className="text-2xl font-semibold text-white">
													{stats.totalDuration ?? 0} minutos
												</div>
											</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div>
				<h2 className="mt-5 mb-2 text-2xl font-bold">
					Lista de cursos asignados al docente
				</h2>
				<CourseListDetails courses={courses} />
			</div>
		</main>
	);
}
