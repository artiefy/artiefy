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
import CourseCarousel from '~/components/super-admin/CourseCarousel'; // Ajusta la ruta si es necesario

interface Stats {
	totalLessons: number;
	completedLessons: number;
	progressPercentage: number;
	averageLessonProgress: number; // Agregamos este campo
	totalActivities: number;
	completedActivities: number;
	forumPosts: number;
	userScore: number;
	totalTimeSpent: number; // 🔹 Tiempo total invertido
	globalCourseScore: string; // 🔹 Nota global del curso
	activities: ActivityDetail[]; // 🔹 Lista de actividades detalladas
	lessonDetails: LessonDetail[]; // Add this line
}

interface ActivityDetail {
	activityId: number;
	name: string;
	description: string;
	isCompleted: boolean;
	score: number;
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
interface LessonDetail {
	lessonId: number;
	title: string;
	progress: number;
	isCompleted: boolean;
	lastUpdated: string; // Add this line
}
interface SelectedDetail {
	title: string;
	value: number | string;
	details?: string;
	activities?: ActivityDetail[]; // Para mostrar actividades en el modal
	lessons?: LessonDetail[]; // Para mostrar lecciones en el modal
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
	const [selectedDetail, setSelectedDetail] = useState<SelectedDetail | null>(
		null
	);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
	const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [lessonDetails, setLessonDetails] = useState<LessonDetail[]>([]);

	const openModal = (detail: SelectedDetail) => {
		console.log('🟢 Mostrando detalle:', detail);

		setSelectedDetail({
			...detail,
			details: detail.details ?? `Información adicional sobre ${detail.title}`,
			activities:
				detail.title === 'Nota Global del Curso' ||
				detail.title === 'Detalles Adicionales'
					? (stats?.activities ?? [])
					: [],
			lessons:
				detail.title === 'Progreso Promedio en Lecciones (%)' ||
				detail.title === 'Lecciones Totales' ||
				detail.title === 'Detalles Adicionales'
					? lessonDetails.length > 0
						? lessonDetails
						: [
								{
									lessonId: 0,
									title: 'No hay lecciones registradas',
									progress: 0,
									isCompleted: false,
									lastUpdated: 'N/A',
								},
							]
					: [],
		});
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setSelectedDetail(null);
		setIsModalOpen(false);
	};

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
					lessonDetails: LessonDetail[];
				};

				setStats({
					...data.statistics,
					averageLessonProgress: data.statistics.averageLessonProgress, // Agregamos este campo
					activities:
						data.statistics.activities.length > 0
							? data.statistics.activities
							: [], // ✅ Aseguramos que nunca sea undefined
				});

				setLessonDetails(
					data.statistics.lessonDetails.length > 0
						? data.statistics.lessonDetails
						: [
								{
									lessonId: 0,
									title: 'No hay lecciones registradas',
									progress: 0,
									isCompleted: false,
									lastUpdated: 'N/A',
								},
							]
				);

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
								value: `${stats.totalLessons} Lecciones`,
								icon: BookOpen,
								details: `El curso contiene un total de ${stats.totalLessons} lecciones.`,
								lessons:
									lessonDetails.length > 0
										? lessonDetails
										: [
												{
													lessonId: 0,
													title: 'No hay lecciones registradas',
													progress: 0,
													isCompleted: false,
													lastUpdated: 'N/A',
												},
											],
							},

							{
								title: 'Progreso Promedio en Lecciones (%)',
								value: `${stats.averageLessonProgress}%`,
								icon: BarChart,
								details: `Progreso promedio basado en todas las lecciones.`,
								lessons:
									lessonDetails.length > 0
										? lessonDetails
										: [
												{
													lessonId: 0,
													title: 'No hay lecciones registradas',
													progress: 0,
													isCompleted: false,
													lastUpdated: 'N/A',
												},
											],
							},

							{
								title: 'Lecciones Completadas',
								value: `${stats.completedLessons} / ${stats.totalLessons}`,
								icon: Award,
								details: `El estudiante ha completado ${stats.completedLessons} de ${stats.totalLessons} lecciones.`,
								lessons:
									lessonDetails.length > 0
										? lessonDetails
										: [
												{
													lessonId: 0,
													title: 'No hay lecciones registradas',
													progress: 0,
													isCompleted: false,
													lastUpdated: 'N/A',
												},
											],
							},
							{
								title: 'Progreso (%)',
								value: `${stats.progressPercentage}%`,
								icon: BarChart,
								details: `El avance general del curso es del ${stats.progressPercentage}%.`,
							},
							{
								title: 'Actividades Totales',
								value: stats.totalActivities,
								icon: FileText,
								details: `El curso tiene ${stats.totalActivities} actividades asignadas.`,
								activities: stats.activities,
							},
							{
								title: 'Actividades Completadas',
								value: `${stats.completedActivities} / ${stats.totalActivities}`,
								icon: Award,
								details: `El estudiante ha completado ${stats.completedActivities} de ${stats.totalActivities} actividades.`,
								activities: stats.activities,
							},
							{
								title: 'Mensajes en Foros',
								value: stats.forumPosts,
								icon: MessageSquare,
								details: `El estudiante ha participado en ${stats.forumPosts} discusiones en el foro.`,
							},
							{
								title: 'Puntaje Total',
								value: stats.userScore,
								icon: Users,
								details: `El estudiante ha acumulado un total de ${stats.userScore} puntos.`,
							},
							{
								title: 'Tiempo Total en Plataforma (min)',
								value: `${stats.totalTimeSpent} min`,
								icon: Calendar,
								details: `El estudiante ha pasado un total de ${stats.totalTimeSpent} minutos en la plataforma.`,
								extraInfo: [
									{
										label: 'Promedio diario',
										value: `${Math.round(stats.totalTimeSpent / 7)} min/día`,
									},
									{ label: 'Última sesión', value: 'Hace 2 días' }, // Aquí puedes hacer una consulta real de la última sesión en la BD
								],
							},

							{
								title: 'Nota Global del Curso',
								value: stats.globalCourseScore,
								icon: Award,
								details: `Nota promedio basada en el puntaje de todas las actividades.`,
								activities: stats.activities,
							},
							{
								title: 'Detalles Adicionales',
								value: '📊 Ver estadísticas completas',
								icon: BarChart,
								details: `Resumen completo de las estadísticas del curso.`,
								activities: stats.activities,
								lessons: lessonDetails,
							},
						].map((stat) => (
							<div
								key={stat.title}
								onClick={() => openModal(stat)}
								className="cursor-pointer rounded-lg bg-gray-800 p-4 hover:bg-gray-700"
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
			{isModalOpen && selectedDetail && (
				<div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
					<div className="relative z-50 w-[90%] max-w-6xl rounded-lg bg-gray-900 p-8 shadow-2xl">
						<h2 className="mb-4 text-center text-2xl font-bold text-white">
							{selectedDetail.title}
						</h2>
						<div className="text-center text-gray-300">
							<p>{selectedDetail.details}</p>

							{/* 📘 Tabla de Lecciones */}
							{selectedDetail.lessons && selectedDetail.lessons.length > 0 && (
								<div className="mt-6">
									<h3 className="text-lg font-semibold text-white">
										📘 Detalles de Lecciones
									</h3>
									<div className="overflow-x-auto">
										<table className="mt-2 w-full border-collapse border border-gray-700">
											<thead>
												<tr className="bg-gray-800 text-white">
													<th className="border border-gray-700 p-2">
														Lección
													</th>
													<th className="border border-gray-700 p-2">
														Progreso
													</th>
													<th className="border border-gray-700 p-2">Estado</th>
													<th className="border border-gray-700 p-2">
														Última actualización
													</th>
												</tr>
											</thead>
											<tbody>
												{selectedDetail.lessons.map((lesson) => (
													<tr key={lesson.lessonId} className="text-gray-300">
														<td className="border border-gray-700 p-2 font-semibold">
															{lesson.title}
														</td>
														<td className="border border-gray-700 p-2 text-center">
															{lesson.progress}%
														</td>
														<td className="border border-gray-700 p-2 text-center">
															{lesson.isCompleted
																? '✅ Completada'
																: '❌ Pendiente'}
														</td>
														<td className="border border-gray-700 p-2 text-center">
															{lesson.lastUpdated !== 'N/A'
																? new Date(
																		lesson.lastUpdated
																	).toLocaleDateString()
																: 'N/A'}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							)}

							{/* 📌 Tabla de Actividades */}
							{selectedDetail.activities &&
								selectedDetail.activities.length > 0 && (
									<div className="mt-6">
										<h3 className="text-lg font-semibold text-white">
											📌 Detalles de Actividades
										</h3>
										<div className="overflow-x-auto">
											<table className="mt-2 w-full border-collapse border border-gray-700">
												<thead>
													<tr className="bg-gray-800 text-white">
														<th className="border border-gray-700 p-2">
															Actividad
														</th>
														<th className="border border-gray-700 p-2">
															Descripción
														</th>
														<th className="border border-gray-700 p-2">
															Estado
														</th>
														<th className="border border-gray-700 p-2">
															Puntaje
														</th>
													</tr>
												</thead>
												<tbody>
													{selectedDetail.activities.map((activity) => (
														<tr
															key={activity.activityId}
															className="text-gray-300"
														>
															<td className="border border-gray-700 p-2">
																{activity.name}
															</td>
															<td className="border border-gray-700 p-2">
																{activity.description}
															</td>
															<td className="border border-gray-700 p-2">
																{activity.isCompleted
																	? '✅ Completada'
																	: '❌ Pendiente'}
															</td>
															<td className="border border-gray-700 p-2">
																{activity.score}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								)}

							{/* 🏆 Resumen General */}
							<div className="mt-6 rounded-lg bg-gray-800 p-4 text-left text-white">
								<h3 className="text-lg font-semibold">🏆 Resumen General</h3>
								<p>
									<strong>📊 Progreso del Curso:</strong>{' '}
									{stats?.progressPercentage}%
								</p>
								<p>
									<strong>📘 Lecciones Completadas:</strong>{' '}
									{stats?.completedLessons} / {stats?.totalLessons}
								</p>
								<p>
									<strong>📌 Actividades Completadas:</strong>{' '}
									{stats?.completedActivities} / {stats?.totalActivities}
								</p>
								<p>
									<strong>⏳ Tiempo Total:</strong> {stats?.totalTimeSpent}{' '}
									minutos
								</p>
								<p>
									<strong>🎯 Nota Global:</strong> {stats?.globalCourseScore}
								</p>
							</div>
						</div>

						{/* 📌 Tabla de Actividades */}
						{selectedDetail.title.includes('Actividades') &&
							selectedDetail.activities && (
								<div className="mt-6">
									<h3 className="text-lg font-semibold text-white">
										📌 Detalles de Actividades
									</h3>
									<div className="overflow-x-auto">
										<table className="mt-2 w-full border-collapse border border-gray-700">
											<thead>
												<tr className="bg-gray-800 text-white">
													<th className="border border-gray-700 p-2">
														Actividad
													</th>
													<th className="border border-gray-700 p-2">
														Descripción
													</th>
													<th className="border border-gray-700 p-2">Estado</th>
													<th className="border border-gray-700 p-2">
														Puntaje
													</th>
												</tr>
											</thead>
											<tbody>
												{selectedDetail.activities.length > 0 ? (
													selectedDetail.activities.map((activity) => (
														<tr
															key={activity.activityId}
															className="text-gray-300"
														>
															<td className="border border-gray-700 p-2 font-semibold">
																{activity.name}
															</td>
															<td className="border border-gray-700 p-2">
																{activity.description || 'Sin descripción'}
															</td>
															<td className="border border-gray-700 p-2 text-center">
																{activity.isCompleted
																	? '✅ Completada'
																	: '⏳ Pendiente'}
															</td>
															<td className="border border-gray-700 p-2 text-center">
																{activity.score || '0'}
															</td>
															<td className="border border-gray-700 p-2 text-center">
																{activity.isCompleted
																	? '🎉 Revisión'
																	: '📌 Pendiente de completar'}
															</td>
														</tr>
													))
												) : (
													<tr>
														<td
															colSpan={5}
															className="p-2 text-center text-gray-400"
														>
															No hay actividades registradas.
														</td>
													</tr>
												)}
											</tbody>
										</table>
									</div>
								</div>
							)}

						{/* 📌 Botones */}
						<div className="mt-6 flex justify-end gap-2">
							<button
								className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
								onClick={() =>
									console.log('🟢 Ver más detalles de:', selectedDetail)
								}
							>
								Ver más
							</button>

							<button
								onClick={() => setIsModalOpen(false)}
								className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
							>
								Cerrar
							</button>
						</div>
					</div>
				</div>
			)}
		</SuperAdminLayout>
	);
}
