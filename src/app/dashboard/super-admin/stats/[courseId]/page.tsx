'use client';

import { useEffect, useState } from 'react';
import {
	BookOpen,
	Award,
	BarChart,
	MessageSquare,
	FileText,
	Users,
	User,
	GraduationCap,
	Calendar,
	ArrowLeft,
} from 'lucide-react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import SuperAdminLayout from '~/app/dashboard/super-admin/super-admin-layout';

interface Stats {
	totalLessons: number;
	completedLessons: number;
	progressPercentage: number;
	totalActivities: number;
	completedActivities: number;
	forumPosts: number;
	userScore: number;
}

interface UserInfo {
	firstName: string;
	email: string;
	role: string;
}

interface CourseInfo {
	title: string;
	instructor: string;
	createdAt: string;
	difficulty: string;
}

export default function StudentCourseDashboard() {
	const params = useParams();
	const searchParams = useSearchParams();
	const router = useRouter();

	const user = searchParams.get('user');
	const courseId = Array.isArray(params.courseId)
		? params.courseId[0]
		: params.courseId;

	const [stats, setStats] = useState<Stats | null>(null);
	const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
	const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch(
					`/api/super-admin/course/${courseId}/stats/${user}`
				);
				const data = (await res.json()) as {
					statistics: Stats;
					user: UserInfo;
					course: CourseInfo;
				};

				setStats(data.statistics);
				setUserInfo(data.user);
				setCourseInfo(data.course);
			} catch (error) {
				console.error('Error cargando estadísticas:', error);
			} finally {
				setLoading(false);
			}
		};

		void fetchData();
	}, [courseId, user]);

	return (
		<SuperAdminLayout>
			<div className="p-6">
				{/* Botón de Volver */}
				<button
					onClick={() => router.push('/dashboard/super-admin')}
					className="mb-4 flex items-center gap-2 rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
				>
					<ArrowLeft size={20} /> Volver Atrás
				</button>

				<h2 className="text-2xl font-bold text-white">Dashboard del Curso</h2>

				{/* Información del Usuario y Curso */}
				<div className="mt-6 flex justify-between rounded-lg bg-gray-900 p-4 text-white">
					{/* Info del Usuario */}
					<div className="flex flex-col">
						<div className="flex items-center gap-2">
							<User className="size-5 text-blue-400" />
							<p className="font-semibold">{userInfo?.firstName}</p>
						</div>
						<p className="text-sm text-gray-400">{userInfo?.email}</p>
						<p className="text-sm text-gray-400">Rol: {userInfo?.role}</p>
					</div>

					{/* Info del Curso */}
					<div className="flex flex-col text-left">
						<div className="flex items-center gap-2">
							<GraduationCap className="size-5 text-green-400" />
							<p className="font-semibold">{courseInfo?.title}</p>
						</div>
						<p className="text-sm text-gray-400">
							Instructor: {courseInfo?.instructor}
						</p>
						<p className="text-sm text-gray-400">
							Dificultad: {courseInfo?.difficulty}
						</p>
						<div className="flex items-center gap-2 text-gray-400">
							<Calendar className="size-4" />
							<p className="text-sm">
								Creado el{' '}
								{new Date(courseInfo?.createdAt ?? '').toLocaleDateString()}
							</p>
						</div>
					</div>
				</div>

				{/* Tarjetas de Estadísticas */}
				{loading ? (
					<p className="mt-6 text-white">Cargando estadísticas...</p>
				) : stats ? (
					<div className="mt-6 grid grid-cols-3 gap-4">
						{[
							{
								title: 'Lecciones Totales',
								value: stats.totalLessons,
								icon: BookOpen,
							},
							{
								title: 'Lecciones Completadas',
								value: stats.completedLessons,
								icon: Award,
							},
							{
								title: 'Progreso (%)',
								value: `${stats.progressPercentage}%`,
								icon: BarChart,
							},
							{
								title: 'Actividades Totales',
								value: stats.totalActivities,
								icon: FileText,
							},
							{
								title: 'Actividades Completadas',
								value: stats.completedActivities,
								icon: Award,
							},
							{
								title: 'Mensajes en Foros',
								value: stats.forumPosts,
								icon: MessageSquare,
							},
							{
								title: 'Puntaje Total',
								value: stats.userScore,
								icon: Users,
							},
						].map((stat) => (
							<div
								key={stat.title}
								className="flex items-center rounded-lg bg-gray-800 p-4"
							>
								<stat.icon className="mr-2 size-5 text-blue-400" />
								<div>
									<h4 className="text-lg font-bold">{stat.value}</h4>
									<p className="text-sm text-gray-400">{stat.title}</p>
								</div>
							</div>
						))}
					</div>
				) : (
					<p className="mt-6 text-white">No hay datos disponibles.</p>
				)}
			</div>
		</SuperAdminLayout>
	);
}
