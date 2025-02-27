'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Eye } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import CourseCarousel from '~/components/educators/modals/CourseCarousel';

interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: string;
	status: string;
	selected?: boolean;
	isNew?: boolean;
}

interface ViewUserResponse {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: string;
	status: string;
	profileImage?: string; // Opcional si viene de Clerk
	password?: string; // Si la API lo devuelve, de lo contrario, elimínalo
	createdAt?: string; // Fecha de creación opcional
	courses?: Course[]; // Añadir cursos
}

interface UserData {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	profileImage?: string;
	createdAt?: string;
	role?: string;
	status?: string;
	password?: string;
	permissions?: string[]; // Add permissions property
}
interface UserData {
	id: string;
	name: string;
	email: string;
	profileImage?: string;
	createdAt?: string;
	role?: string;
	status?: string;
	password?: string;
}

interface Course {
	id: string;
	title: string;
	coverImageKey: string | null; // Añadimos la propiedad coverImageKey
	coverImage?: string;
}

interface CoursesData {
	courses: Course[];
}

interface ViewUserResponse {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	profileImage?: string;
	createdAt?: string;
	role: string;
	status: string;
	password?: string;
	courses?: Course[];
}

export default function DashboardEstudiantes() {
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
	const searchParams = useSearchParams();
	const query = searchParams?.get('search') ?? '';
	const [viewUser, setViewUser] = useState<ViewUserResponse | null>(null);

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
	const fetchCourses = useCallback(async () => {
		try {
			const res = await fetch('/api/super-admin/courses');
			if (!res.ok) throw new Error('Error al cargar cursos');
			const rawData: unknown = await res.json();
			if (!Array.isArray(rawData)) throw new Error('Invalid data received');
		} catch (err) {
			console.error('Error fetching courses:', err);
		}
	}, []);
	// Definir la interfaz de los datos del usuario

	const handleViewUser = async (user: User): Promise<void> => {
		try {
			// Obtener información básica del usuario
			const userRes = await fetch(`/api/educadores/infoUser?id=${user.id}`);
			if (!userRes.ok) throw new Error('Error al obtener datos del usuario');

			const userData: UserData = (await userRes.json()) as UserData;

			// Validar que los datos sean correctos
			if (!userData?.name || !userData?.email || !userData?.id) {
				throw new Error('Datos del usuario inválidos');
			}

			// Extraer el primer y segundo nombre de `name` (en caso de que tenga más de un nombre)
			const [firstName, lastName] = userData.name.split(' ');

			const validUserData: ViewUserResponse = {
				id: String(userData.id),
				firstName: firstName || 'Nombre no disponible',
				lastName: lastName || 'Apellido no disponible',
				email: String(userData.email),
				profileImage: userData.profileImage ?? '/default-avatar.png',
				createdAt: userData.createdAt ?? 'Fecha no disponible',
				role: userData.role ?? 'Sin rol',
				status: userData.status ?? 'Activo',
				password: userData.password ?? 'No disponible',
				courses: [], // Esto se completará con los cursos más tarde
			};

			// Guardar el usuario con los cursos en el estado
			setViewUser(validUserData);

			// Obtener los cursos
			const coursesRes = await fetch(
				`/api/educadores/userCourses?userId=${user.id}`
			);
			if (!coursesRes.ok) throw new Error('Error al obtener los cursos');

			const coursesData = (await coursesRes.json()) as CoursesData;

			// Validar que los cursos sean correctos
			if (!coursesData || !Array.isArray(coursesData.courses)) {
				throw new Error('Error en los datos de los cursos');
			}

			// Mapear los cursos
			console.log(
				'📌 Cursos obtenidos en `handleViewUser`:',
				coursesData.courses
			);
			const courses = coursesData.courses.map((course) => ({
				id: course.id,
				title: course.title || 'Sin título',
				coverImageKey: course.coverImageKey ?? null,
				coverImage: course.coverImage ?? '/default-course.jpg',
			}));

			// Actualizar el estado con los cursos
			setViewUser({
				...validUserData,
				courses,
			});
		} catch (error) {
			console.error('Error al obtener usuario o cursos:', error);
		}
	};

	useEffect(() => {
		void fetchCourses();
	}, [fetchCourses]);

	const fetchUsers = useCallback(async () => {
		try {
			const res = await fetch(
				`/api/educadores/users?search=${encodeURIComponent(query)}`
			);
			if (!res.ok) throw new Error('Error al cargar usuarios');

			const rawData: unknown = await res.json();
			if (!Array.isArray(rawData)) throw new Error('Datos inválidos recibidos');

			const data: User[] = (rawData as User[]).map((item) => ({
				id: String(item.id),
				firstName: String(item.firstName),
				lastName: String(item.lastName),
				email: String(item.email),
				role: String(item.role),
				status: String(item.status),
				permissions:
					'permissions' in item && Array.isArray(item.permissions)
						? item.permissions
						: [], // ✅ Asegura que `permissions` se guarden correctamente
			}));

			setUsers(data);
			console.log('✅ Usuarios cargados con permisos:', data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error desconocido');
			console.error('Error fetching users:', err);
		} finally {
			setLoading(false);
		}
	}, [query]);

	// ✅ Ahora, `useEffect` ya no mostrará advertencias
	useEffect(() => {
		void fetchUsers();
	}, [fetchUsers]);

	return (
		<>
			<header className="flex justify-between rounded-lg bg-primary p-6 text-3xl font-bold text-[#01142B] shadow-md">
				<h1>Administrador de usuarios del curso</h1>
			</header>

			<div className="p-6">
				{error && (
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
						{viewUser && (
							<div className="fixed inset-0 z-[10000] flex items-center justify-center backdrop-blur-md">
								<div className="relative z-50 w-full max-w-5xl rounded-lg bg-[#01142B] p-8 text-white shadow-xl">
									{/* Información del Usuario */}
									<div className="flex">
										{/* Foto de Perfil */}
										<div className="ml-20 size-48 overflow-hidden rounded-full border-4 border-[#3AF4EF]">
											{viewUser.profileImage ? (
												<Image
													src={viewUser.profileImage}
													alt="Foto de perfil"
													width={200}
													height={200}
												/>
											) : (
												<div className="flex size-full items-center justify-center bg-gray-600 text-center text-5xl text-white">
													{viewUser.firstName?.charAt(0)}
												</div>
											)}
										</div>

										{/* Información del Usuario */}
										<div className="ml-80 flex flex-col justify-start space-y-7">
											<h2 className="text-2xl font-bold text-primary">
												Estudiante:
											</h2>
											<p className="text-4xl font-semibold">
												{viewUser.firstName} {viewUser.lastName}
											</p>
											<p className="text-lg text-gray-400">{viewUser.email}</p>
											<p className="text-lg">
												<strong>Estado:</strong>{' '}
												<span className="font-bold text-[#3AF4EF]">
													{viewUser.status}
												</span>
											</p>
											<p className="text-lg">
												<strong>Perfil creado:</strong>{' '}
												{viewUser.createdAt ?? 'Fecha no disponible'}
											</p>
										</div>
									</div>

									{/* 🔹 Carrusel de Cursos dentro del modal */}
									<div className="mt-6">
										<h3 className="text-2xl font-bold text-white">
											Cursos del Estudiante
										</h3>
										{viewUser.courses && viewUser.courses.length > 0 ? (
											<CourseCarousel
												courses={viewUser.courses}
												userId={viewUser.id}
											/>
										) : (
											<p className="text-gray-400">
												Este usuario no está inscrito en ningún curso.
											</p>
										)}
									</div>

									{/* Botón de Cerrar */}
									<div className="mt-6 text-center">
										<button
											onClick={() => setViewUser(null)}
											className="rounded bg-red-500 px-6 py-3 text-white transition hover:bg-red-600"
										>
											Cerrar
										</button>
									</div>
								</div>
							</div>
						)}

						<div className="mt-6 flex flex-col gap-4">
							{/* 🔍 Buscador por Nombre o Correo */}
							<div className="flex items-center gap-2 rounded-lg bg-white p-4 text-black shadow-md">
								<input
									type="text"
									placeholder="Buscar por nombre o correo..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none"
								/>
							</div>

							<div className="mt-6 overflow-x-auto rounded-lg bg-gray-800/40 p-4 shadow-md">
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
												Acciones
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-700">
										{currentUsers.map((user) => (
											<tr
												key={user.id}
												className={`rounded-lg transition duration-300 hover:bg-gray-800 hover:shadow-lg ${
													user.isNew ? 'bg-primary text-black' : ''
												}`}
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
												<td className="flex space-x-2 px-4 py-3">
													<button
														onClick={() => handleViewUser(user)}
														className="flex items-center rounded-md bg-primary px-2 py-1 text-xs font-medium text-black shadow-md transition duration-300"
													>
														<Eye size={14} className="mr-1" /> Ver
													</button>
												</td>
											</tr>
										))}
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
		</>
	);
}
