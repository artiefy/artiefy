'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Eye } from 'lucide-react';
import { getUsersEnrolledInCourse } from '~/server/queries/queriesEducator';

interface LessonProgress {
	lessonId: number;
	progress: number;
	isCompleted: boolean;
}

interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	lastConnection?: string; // Añadir última fecha de conexión
	lessonsProgress: LessonProgress[]; // Add lessonsProgress property
	averageProgress: number; // Add averageProgress property
}

interface LessonsListProps {
	courseId: number;
	selectedColor: string;
}

const DashboardEstudiantes: React.FC<LessonsListProps> = ({
	courseId,
	selectedColor,
}) => {
	const [users, setUsers] = useState<User[]>([]);
	// 🔍 Estados de búsqueda y filtros
	const [searchQuery, setSearchQuery] = useState(''); // Búsqueda por nombre o correo
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editingUser] = useState<User | null>(null);
	const [editValues, setEditValues] = useState<{
		firstName: string;
		lastName: string;
	}>({
		firstName: '',
		lastName: '',
	});

	// 1️⃣ Filtrar usuarios
	const filteredUsers = users.filter(
		(user) =>
			searchQuery === '' ||
			user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// 2️⃣ Definir la paginación
	const [currentPage, setCurrentPage] = useState(1);
	const usersPerPage = 12;
	const indexOfLastUser = currentPage * usersPerPage;
	const indexOfFirstUser = indexOfLastUser - usersPerPage;
	const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

	const fetchEnrolledUsers = useCallback(async (courseId: number) => {
		try {
			const users = await getUsersEnrolledInCourse(courseId);
			const formattedUsers = users.map((user) => {
				const totalProgress = user.lessonsProgress.reduce(
					(acc, lesson) => acc + lesson.progress,
					0
				);
				const averageProgress =
					user.lessonsProgress.length > 0
						? totalProgress / user.lessonsProgress.length
						: 0;

				return {
					...user,
					firstName: user.firstName ?? 'Nombre no disponible',
					lastName: user.lastName ?? 'Apellido no disponible',
					email: user.email ?? 'Correo no disponible',
					averageProgress,
					lastConnection:
						typeof user.lastConnection === 'number'
							? new Date(user.lastConnection).toLocaleDateString()
							: (user.lastConnection ?? 'Fecha no disponible'),
				};
			});
			setUsers(formattedUsers);
			console.log('✅ Usuarios inscritos cargados:', users);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error desconocido');
			console.error('Error fetching enrolled users:', err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchEnrolledUsers(courseId);
	}, [fetchEnrolledUsers, courseId]);

	return (
		<>
			<div className="group relative">
				<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100"></div>
				<header className="relative z-20 flex justify-between rounded-lg bg-primary p-6 text-3xl font-bold text-[#01142B] shadow-md">
					<h1>Estadisticas de estudiantes</h1>
				</header>

				<div
					className="relative z-20 rounded-lg p-6"
					style={{ backgroundColor: selectedColor }}
				>
					{error && currentUsers.length <= 0 && (
						<div className="mb-6 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
							<p>{error}</p>
						</div>
					)}

					{loading ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="size-6 animate-spin text-primary" />
							<span className="ml-2">Cargando usuarios...</span>
						</div>
					) : (
						<>
							<div className="mt-6 flex flex-col gap-4">
								{/* 🔍 Buscador por Nombre o Correo */}
								<div className="rounded-lg bg-gray-800 p-4 shadow-md">
									<h2 className="ml-2 font-bold">Buscar estudiante</h2>
									<div className="flex items-center gap-2 rounded-lg bg-white p-4 text-black shadow-md">
										<input
											type="text"
											placeholder="Buscar por nombre o correo..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none"
										/>
									</div>
								</div>
								<div className="mt-6 overflow-x-auto rounded-lg bg-gray-800 p-4 shadow-md">
									<table className="w-full rounded-lg text-white shadow-lg">
										<thead className="rounded-lg bg-primary text-[#01142B]">
											<tr className="rounded-lg">
												<th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">
													Nombre
												</th>
												<th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">
													Correo
												</th>
												<th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">
													Progreso
												</th>
												<th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">
													Ultima conexion
												</th>

												<th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">
													Acciones
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-700">
											{currentUsers.length > 0 ? (
												currentUsers.map((user, index) => (
													<tr
														key={`${user.id}-${index}`} // Asegúrate de que la clave sea única
														className={`relative z-50 rounded-lg transition duration-300 hover:bg-gray-800 hover:shadow-lg`}
													>
														<td className="rounded-lg px-4 py-3 text-sm text-gray-300">
															{editingUser?.id === user.id ? (
																<div className="flex space-x-2">
																	<input
																		type="text"
																		className="w-1/2 rounded-lg border-none bg-gray-800 px-2 py-1 text-xs text-white"
																		value={editValues.firstName}
																		onChange={(e) =>
																			setEditValues({
																				...editValues,
																				firstName: e.target.value,
																			})
																		}
																	/>
																	<input
																		type="text"
																		className="w-1/2 rounded-lg border-none bg-gray-800 px-2 py-1 text-xs text-white"
																		value={editValues.lastName}
																		onChange={(e) =>
																			setEditValues({
																				...editValues,
																				lastName: e.target.value,
																			})
																		}
																	/>
																</div>
															) : (
																`${user.firstName} ${user.lastName}`
															)}
														</td>
														<td className="px-4 py-3 text-xs text-gray-400">
															{user.email}
														</td>
														<td className="flex space-x-2 px-4 py-3 text-xs text-gray-400">
															<div className="mt-1 h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
																<div
																	className="h-2.5 rounded-full bg-blue-600"
																	style={{ width: `${user.averageProgress}%` }}
																></div>
															</div>
															<p>{user.averageProgress.toFixed(1)}%</p>
														</td>
														<td className="px-4 py-3 text-xs text-gray-400">
															{user.lastConnection ?? 'Fecha no disponible'}
														</td>
														<td className="flex space-x-2 px-4 py-3">
															<button
																// onClick={() => handleViewUser(user)}
																className="flex items-center rounded-md bg-primary px-2 py-1 text-xs font-medium text-black shadow-md transition duration-300"
															>
																<Eye size={14} className="mr-1" /> Ver
															</button>
														</td>
													</tr>
												))
											) : (
												<tr className="text-center">
													<td colSpan={3} className="py-4 text-gray-400">
														No hay usuarios por el momento
													</td>
												</tr>
											)}
										</tbody>
									</table>
									<div className="mt-4 flex justify-center space-x-2">
										<button
											onClick={() =>
												setCurrentPage((prev) => Math.max(prev - 1, 1))
											}
											disabled={currentPage === 1}
											className="rounded bg-gray-700 px-4 py-2 text-white disabled:opacity-50"
										>
											Anterior
										</button>

										<span className="rounded bg-gray-800 px-4 py-2 text-white">
											Página {currentPage} de{' '}
											{Math.ceil(filteredUsers.length / usersPerPage)}
										</span>

										<button
											onClick={() =>
												setCurrentPage((prev) =>
													prev < Math.ceil(filteredUsers.length / usersPerPage)
														? prev + 1
														: prev
												)
											}
											disabled={
												currentPage ===
												Math.ceil(filteredUsers.length / usersPerPage)
											}
											className="rounded bg-gray-700 px-4 py-2 text-white disabled:opacity-50"
										>
											Siguiente
										</button>
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</>
	);
};

export default DashboardEstudiantes;
