'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
	BookOpen,
	Award,
	BarChart,
	MessageSquare,
	FileText,
	Users,
} from 'lucide-react';
import SuperAdminLayout from '~/app/dashboard/super-admin/super-admin-layout';

type Stats = {
	totalLessons: number;
	completedLessons: number;
	progressPercentage: number;
	totalActivities: number;
	completedActivities: number;
	forumPosts: number;
	userScore: number;
};

export default function StudentCourseDashboard() {
	const searchParams = useSearchParams();
	const courseId = searchParams.get('courseId');
	const user = searchParams.get('user');

	const [stats, setStats] = useState<Stats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!courseId || !user) return;

		const fetchData = async () => {
			try {
				const res = await fetch(
					`/api/super-admin/courses/${courseId}/stats/${user}`
				);
				const data: Stats = await res.json() as Stats;
				setStats(data);
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
				<h2 className="text-2xl font-bold text-white">Dashboard del Curso</h2>

				{loading ? (
					<p className="text-white">Cargando...</p>
				) : stats ? (
					<>
						{/* Tarjetas de Estadísticas */}
						<div className="grid grid-cols-3 gap-4 mt-6">
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
									className="p-4 rounded-lg bg-gray-800 flex items-center"
								>
									<stat.icon className="mr-2 size-5 text-blue-400" />
									<div>
										<h4 className="text-lg font-bold">{stat.value}</h4>
										<p className="text-sm text-gray-400">{stat.title}</p>
									</div>
								</div>
							))}
						</div>
					</>
				) : (
					<p className="text-white">No hay datos disponibles.</p>
				)}
			</div>
		</SuperAdminLayout>
	);
}
