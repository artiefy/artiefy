'use client';
import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { GraduationCap } from 'lucide-react';
import {
	FaGraduationCap,
	FaBook,
	FaClock,
	FaChalkboardTeacher,
} from 'react-icons/fa';
import CourseListDetails from '~/components/educators/layout/CourseListDetails';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import { toast } from '~/hooks/use-toast';

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
	dificultadid: string; // Add this line
	requerimientos: string;
	totalParametros: number; // Add this line
}

export interface StatsModel {
	totalCourses: number;
	totalLessons: number;
	totalEnrollments: number;
	totalDuration: number;
}

export default function Home() {
	const { user } = useUser();
	const [courses, setCourses] = useState<CourseModel[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [stats, setStats] = useState<StatsModel>({
		totalCourses: 0,
		totalLessons: 0,
		totalEnrollments: 0,
		totalDuration: 0,
	});

	// Fetch stats
	const fetchStats = useCallback(async () => {
		if (!user) return;
		try {
			const response = await fetch(
				`/api/educadores/dashboard?userId=${user.id}`
			);
			if (response.ok) {
				const data = (await response.json()) as StatsModel;
				setStats(data);
			} else {
				const errorData = (await response.json()) as { error?: string };
				const errorMessage = errorData.error ?? response.statusText;
				toast({
					title: 'Error',
					description: `No se pudieron cargar las estadísticas: ${errorMessage}`,
					variant: 'destructive',
				});
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Error desconocido';
			toast({
				title: 'Error',
				description: `No se pudieron cargar las estadísticas: ${errorMessage}`,
				variant: 'destructive',
			});
		}
	}, [user]);

	console.log('stats', stats);

	useEffect(() => {
		if (user) {
			fetchStats().catch((error) =>
				console.error('Error fetching stats:', error)
			);
		}
	}, [user, fetchStats]);

	const fetchCourses = useCallback(async () => {
		if (!user) return;
		try {
			setLoading(true);
			setError(null);
			const response = await fetch(`/api/educadores/courses?userId=${user.id}`);
			if (response.ok) {
				const data = (await response.json()) as CourseModel[];
				setCourses(
					data.map((course) => ({
						...course,
						dificultadid: course.dificultadid ?? '', // Map it properly
						categoryid: course.categoryid, // Map categoryid properly
						modalidadesid: course.modalidadesid, // Map modalidadesid properly
					})) as CourseModel[]
				);
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
				error instanceof Error ? error.message : 'Error desconocido';
			setError(`Error al cargar los cursos: ${errorMessage}`);
			toast({
				title: 'Error',
				description: `No se pudieron cargar los cursos: ${errorMessage}`,
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	}, [user]);

	useEffect(() => {
		if (user) {
			fetchCourses().catch((error) =>
				console.error('Error fetching courses:', error)
			);
		}
	}, [user, fetchCourses]);

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
			<div className="mb-3 rounded-lg bg-white shadow">
				<div className="mx-auto flex max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
					<GraduationCap className="h-14 w-12 text-primary" />
					<div className="ml-4 flex flex-col">
						<h1 className="text-2xl font-bold text-gray-900">
							<span className="text-primary">Artiefy</span> panel de control
						</h1>
						<p className="text-gray-500">
							¡Bienvenido al panel de vuelta, educador: {user?.firstName}!
						</p>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-0">
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{/* Average Grade Card */}
					<div className="overflow-hidden rounded-lg bg-white shadow">
						<div className="p-5">
							<div className="flex items-center">
								<div className="shrink-0">
									<FaGraduationCap className="size-6 text-[hsl(178.4,89.4%,59.2%)]" />
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="truncate text-sm font-medium text-gray-500">
											Promedio General de estudiantes
										</dt>
										<dd className="flex items-baseline">
											<div className="text-2xl font-semibold text-gray-900">
												{stats.totalEnrollments ?? 0}
											</div>
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					<div className="overflow-hidden rounded-lg bg-white shadow">
						<div className="p-5">
							<div className="flex items-center">
								<div className="shrink-0">
									<FaBook className="size-6 text-[hsl(178.4,89.4%,59.2%)]" />
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="truncate text-sm font-medium text-gray-500">
											Total de Cursos
										</dt>
										<dd className="flex items-baseline">
											<div className="text-2xl font-semibold text-gray-900">
												{stats.totalCourses ?? 0}
											</div>
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					<div className="overflow-hidden rounded-lg bg-white shadow">
						<div className="p-5">
							<div className="flex items-center">
								<div className="shrink-0">
									<FaChalkboardTeacher className="size-6 text-[hsl(178.4,89.4%,59.2%)]" />
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="truncate text-sm font-medium text-gray-500">
											Total de Clases
										</dt>
										<dd className="flex items-baseline">
											<div className="text-2xl font-semibold text-gray-900">
												{stats.totalLessons ?? 0}
											</div>
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					<div className="overflow-hidden rounded-lg bg-white shadow">
						<div className="p-5">
							<div className="flex items-center">
								<div className="shrink-0">
									<FaClock className="size-6 text-[hsl(178.4,89.4%,59.2%)]" />
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="truncate text-sm font-medium text-gray-500">
											Duración Total de las clases
										</dt>
										<dd className="flex items-baseline">
											<div className="text-2xl font-semibold text-gray-900">
												{stats.totalDuration ?? 0}
											</div>
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div>
				<h2 className="mb-2 mt-5 text-2xl font-bold">
					Lista de cursos asignados al docente
				</h2>
				<CourseListDetails courses={courses} />
			</div>
		</main>
	);
}
