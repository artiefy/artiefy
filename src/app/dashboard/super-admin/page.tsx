'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
	Loader2,
	X,
	XCircle,
	Edit,
	Trash2,
	UserPlus,
	Check,
	Eye,
} from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import EditUserModal from '~/app/dashboard/super-admin/users/EditUserModal'; // Ajusta la ruta según la ubicación de tu componente
import CourseCarousel from '~/components/super-admin/CourseCarousel';
import {
	setRoleWrapper,
	deleteUser,
	updateUserInfo,
} from '~/server/queries/queries';
import BulkUploadUsers from './components/BulkUploadUsers'; // Ajusta la ruta según la ubicación de tu componente
import { ConfirmDialog } from './components/ConfirmDialog';
import { InfoDialog } from './components/InfoDialog';
import SuperAdminLayout from './super-admin-layout';

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

type ConfirmationState = {
	isOpen: boolean;
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel?: () => void;
} | null;

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

export default function AdminDashboard() {
	const [users, setUsers] = useState<User[]>([]);
	// 🔍 Estados de búsqueda y filtros
	const [searchQuery, setSearchQuery] = useState(''); // Búsqueda por nombre o correo
	const [roleFilter, setRoleFilter] = useState(''); // Filtro por rol
	const [statusFilter, setStatusFilter] = useState(''); // Filtro por estado
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [updatingUserId, setUpdatingUserId] = useState<string | null>(
		null as string | null
	);
	const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
	const [notification, setNotification] = useState<{
		message: string;
		type: 'success' | 'error';
	} | null>(null);
	const [editingUser, setEditingUser] = useState<User | null>(null);

	const [editValues, setEditValues] = useState<{
		firstName: string;
		lastName: string;
	}>({
		firstName: '',
		lastName: '',
	});
	const [infoDialogOpen, setInfoDialogOpen] = useState(false);
	const [infoDialogTitle, setInfoDialogTitle] = useState('');
	const [infoDialogMessage, setInfoDialogMessage] = useState('');

	const searchParams = useSearchParams();
	const query = searchParams.get('search') ?? '';
	const [newUser, setNewUser] = useState({
		firstName: '',
		lastName: '',
		email: '',
		role: 'estudiante',
	});
	const [creatingUser, setCreatingUser] = useState(false);
	const [viewUser, setViewUser] = useState<ViewUserResponse | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	const [showCreateForm, setShowCreateForm] = useState(false);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const handleUserSelection = useCallback((userId: string) => {
		setSelectedUsers((prevSelected) =>
			prevSelected.includes(userId)
				? prevSelected.filter((id) => id !== userId)
				: [...prevSelected, userId]
		);
	}, []);

	// 1️⃣ Filtrar usuarios
	const filteredUsers = users.filter(
		(user) =>
			(searchQuery === '' ||
				user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
			(roleFilter ? user.role === roleFilter : true) &&
			(statusFilter ? user.status === statusFilter : true)
	);

	// 2️⃣ Definir la paginación
	const [currentPage, setCurrentPage] = useState(1);
	const usersPerPage = 10;
	const indexOfLastUser = currentPage * usersPerPage;
	const indexOfFirstUser = indexOfLastUser - usersPerPage;
	const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

	const [showAssignModal, setShowAssignModal] = useState(false);
	const handleSelectStudent = (userId: string) => {
		setSelectedStudents((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId]
		);
	};
	const fetchCourses = useCallback(async () => {
		try {
			const res = await fetch('/api/super-admin/courses');
			if (!res.ok) throw new Error('Error al cargar cursos');
			const rawData: unknown = await res.json();
			if (!Array.isArray(rawData)) throw new Error('Invalid data received');
			const data: { id: string; title: string }[] = rawData.filter(
				(item): item is { id: string; title: string } =>
					typeof item === 'object' &&
					item !== null &&
					'id' in item &&
					'title' in item
			);
			setCourses(data);
		} catch (err) {
			console.error('Error fetching courses:', err);
		}
	}, []);

	const handleAssignStudents = async () => {
		if (!selectedCourse || selectedStudents.length === 0) return;

		try {
			const res = await fetch('/api/enrollments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					courseId: selectedCourse,
					userIds: selectedStudents,
				}),
			});

			if (!res.ok) throw new Error('Error al asignar estudiantes');

			const result = (await res.json()) as {
				added: number;
				alreadyEnrolled: number;
				message: string;
			};
			const { message } = result;

			// 🔹 Cierra el modal antes de mostrar la confirmación
			setShowAssignModal(false);

			// 🔹 Espera un pequeño tiempo para evitar superposición de animaciones
			setTimeout(() => {
				setConfirmation({
					isOpen: true,
					title: 'Asignación de Estudiantes',
					message: `${message} \n\n ¿Quieres seguir asignando más estudiantes?`,
					onConfirm: () => {
						//  Si el usuario quiere seguir, vuelve a abrir el modal
						setSelectedStudents([]);
						setSelectedCourse(null);
						setShowAssignModal(true);
					},
					onCancel: () => {
						//  Si el usuario no quiere seguir, cierra la confirmación
						setConfirmation(null);
					},
				});
			}, 300); // 🔹 Esperamos 300ms para evitar superposición de animaciones
		} catch {
			showNotification('Error al asignar estudiantes', 'error');
		}
	};
	const [newCoverImageKey, setNewCoverImageKey] = useState<string | null>(null);
	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			const uploadResponse = await fetch('/api/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
			});

			if (!uploadResponse.ok) throw new Error('Error al obtener URL de carga');

			const uploadData = (await uploadResponse.json()) as {
				url: string;
				fields: Record<string, string>;
			};
			const { url, fields } = uploadData;

			const formData = new FormData();
			Object.entries(fields).forEach(([key, value]) => {
				if (typeof value === 'string') {
					formData.append(key, value);
				}
			});
			formData.append('file', file);

			const s3UploadResponse = await fetch(url, {
				method: 'POST',
				body: formData,
			});

			if (!s3UploadResponse.ok) throw new Error('Error al subir imagen');

			// Actualizamos el estado con la nueva clave de la imagen
			setNewCoverImageKey(fields.key);
			console.log(
				'Nuevo valor de newCoverImageKey:',
				(fields as { key: string }).key
			); // Verifica si la clave es válida
		} catch (error) {
			console.error('Error al subir imagen:', error);
		}
	};

	// Definir la interfaz de los datos del usuario

	const handleViewUser = async (user: User): Promise<void> => {
		try {
			// Obtener información básica del usuario
			const userRes = await fetch(`/api/super-admin/infoUser?id=${user.id}`);
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
				`/api/super-admin/userCourses?userId=${user.id}`
			);
			if (!coursesRes.ok) throw new Error('Error al obtener los cursos');

			const coursesData = (await coursesRes.json()) as CoursesData;

			// Validar que los cursos sean correctos
			if (!coursesData || !Array.isArray(coursesData.courses)) {
				throw new Error('Error en los datos de los cursos');
			}

			// Mapear los cursos
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

			setShowPassword(false);
		} catch (error) {
			console.error('Error al obtener usuario o cursos:', error);
		}
	};

	useEffect(() => {
		void fetchCourses();
	}, [fetchCourses]);

	const fetchUsers = useCallback(async () => {
		try {
			const res = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
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

	const showNotification = useCallback(
		(message: string, type: 'success' | 'error') => {
			setNotification({ message, type });
			setTimeout(() => setNotification(null), 3000);
		},
		[]
	);

	interface CreateUserResponse {
		user: {
			id: string;
			username: string;
		};
		generatedPassword: string;
	}

	const handleCreateUser = async () => {
		if (
			!newUser.firstName.trim() ||
			!newUser.lastName.trim() ||
			!newUser.email.trim()
		) {
			showNotification('Todos los campos son obligatorios.', 'error');
			return;
		}

		try {
			setCreatingUser(true);
			const res = await fetch('/api/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					firstName: newUser.firstName,
					lastName: newUser.lastName,
					email: newUser.email,
					role: newUser.role,
				}),
			});

			if (!res.ok) {
				throw new Error('No se pudo crear el usuario');
			}

			const rawData: unknown = await res.json();
			if (
				typeof rawData !== 'object' ||
				rawData === null ||
				!('user' in rawData) ||
				!('generatedPassword' in rawData)
			) {
				throw new Error('Respuesta de la API en formato incorrecto');
			}

			const { user: safeUser, generatedPassword } =
				rawData as CreateUserResponse;
			if (
				!safeUser ||
				typeof safeUser !== 'object' ||
				!('id' in safeUser) ||
				!('username' in safeUser)
			) {
				throw new Error('Usuario inválido en la respuesta de la API');
			}

			const username = safeUser.username;
			setUsers([
				{
					id: safeUser.id,
					firstName: newUser.firstName,
					lastName: newUser.lastName,
					email: newUser.email,
					role: newUser.role,
					status: 'activo',
					isNew: true, // 🔹 Marcar como usuario nuevo
				},
				...users,
			]);

			setInfoDialogTitle('Usuario Creado');
			setInfoDialogMessage(
				`Se ha creado el usuario "${username}" con la contraseña: ${generatedPassword}`
			);
			setInfoDialogOpen(true);

			// ✅ Cerrar el modal después de crear el usuario
			setShowCreateForm(false);

			setNewUser({
				firstName: '',
				lastName: '',
				email: '',
				role: 'estudiante',
			});
		} catch {
			showNotification('Error al crear el usuario.', 'error');
		} finally {
			setCreatingUser(false);
		}
	};

	const handleMassUpdateStatus = async (newStatus: string) => {
		if (selectedUsers.length === 0) {
			showNotification('No has seleccionado usuarios.', 'error');
			return;
		}

		try {
			await fetch('/api/users', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'updateMultipleStatus',
					userIds: selectedUsers,
					status: newStatus,
				}),
			});

			setUsers(
				users.map((user) =>
					selectedUsers.includes(user.id)
						? { ...user, status: newStatus }
						: user
				)
			);
			setSelectedUsers([]);
			showNotification(`Usuarios actualizados a ${newStatus}.`, 'success');
		} catch {
			showNotification('Error al actualizar usuarios.', 'error');
		}
	};

	const handleRoleChange = (userId: string, newRole: string) => {
		setConfirmation({
			isOpen: true,
			title: 'Actualizar Rol',
			message: `¿Estás seguro de que quieres cambiar el rol de este usuario a ${newRole}?`,
			onConfirm: () => {
				void (async () => {
					try {
						setUpdatingUserId(userId);
						await setRoleWrapper({ id: userId, role: newRole });

						setUsers(
							users.map((user) =>
								user.id === userId ? { ...user, role: newRole } : user
							)
						);

						showNotification('Rol actualizado con éxito.', 'success');
					} catch {
						showNotification('Error al actualizar el rol.', 'error');
					} finally {
						setUpdatingUserId(null);
					}
				})(); // Llamamos la función inmediatamente
			},
		});
	};

	const handleStatusChange = (userId: string, newStatus: string) => {
		setConfirmation({
			isOpen: true,
			title: 'Actualizar Estado',
			message: `¿Estás seguro de que quieres cambiar el estado del usuario a "${newStatus}"?`,
			onConfirm: () => {
				void (async () => {
					try {
						setUpdatingUserId(userId);
						await fetch('/api/users', {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								action: 'updateStatus',
								id: userId,
								status: newStatus,
							}),
						});

						setUsers(
							users.map((user) =>
								user.id === userId ? { ...user, status: newStatus } : user
							)
						);

						showNotification('Estado actualizado con éxito.', 'success');
					} catch {
						showNotification('Error al actualizar el estado.', 'error');
					} finally {
						setUpdatingUserId(null);
						setConfirmation(null);
					}
				})(); // Ejecutamos la función inmediatamente
			},
		});
	};

	const handleMassRemoveRole = () => {
		if (selectedUsers.length === 0) {
			showNotification('No has seleccionado usuarios.', 'error');
			return;
		}

		setConfirmation({
			isOpen: true,
			title: 'Eliminar Roles',
			message:
				'¿Estás seguro de que quieres eliminar el rol de los usuarios seleccionados?',
			onConfirm: () => {
				void (async () => {
					try {
						await fetch('/api/users', {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								action: 'removeRole',
								userIds: selectedUsers,
							}),
						});

						// Actualizar los usuarios en el estado local
						setUsers(
							users.map((user) =>
								selectedUsers.includes(user.id)
									? { ...user, role: 'sin-role' }
									: user
							)
						);

						setSelectedUsers([]); // Limpiar selección
						showNotification('Roles eliminados con éxito.', 'success');
					} catch {
						showNotification('Error al eliminar roles.', 'error');
					} finally {
						setConfirmation(null);
					}
				})(); // ✅ Ejecutamos la función inmediatamente
			},
		});
	};

	const handleDeleteUser = (userId: string) => {
		setConfirmation({
			isOpen: true,
			title: 'Eliminar Usuario',
			message:
				'¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.',
			onConfirm: () => {
				void (async () => {
					try {
						setUpdatingUserId(userId);
						await deleteUser(userId);

						setUsers(users.filter((user) => user.id !== userId));
						showNotification('Usuario eliminado correctamente.', 'success');
					} catch {
						showNotification('Error al eliminar el usuario.', 'error');
					} finally {
						setUpdatingUserId(null);
						setConfirmation(null);
					}
				})(); // ✅ Ejecutamos la función inmediatamente
			},
		});
	};

	const handleSaveUser = () => {
		if (!editingUser) return; // Evita que sea null

		void (async () => {
			try {
				setUpdatingUserId(editingUser.id);
				await updateUserInfo(
					editingUser.id,
					editValues.firstName,
					editValues.lastName
				);

				setUsers(
					users.map((user) =>
						user.id === editingUser.id
							? {
									...user,
									firstName: editValues.firstName,
									lastName: editValues.lastName,
								}
							: user
					)
				);

				setEditingUser(null);
				showNotification('Usuario actualizado con éxito.', 'success');
			} catch {
				showNotification('Error al actualizar usuario.', 'error');
			} finally {
				setUpdatingUserId(null);
			}
		})();
	};

	const [modalIsOpen, setModalIsOpen] = useState(false); // ✅ Asegurar que está definido
	const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
	const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
	const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);

	const handleMassUserUpload = useCallback(
		(newUsers: User[]) => {
			if (!newUsers || newUsers.length === 0) return;

			// 🔹 Mantener `isNew: true` sin afectar los usuarios previos
			setUsers((prevUsers) => [
				...newUsers.map((user) => ({ ...user, isNew: true })), // Nuevos usuarios en azul
				...prevUsers, // Mantener los usuarios anteriores
			]);

			// ✅ Mostrar notificación de éxito
			showNotification(
				`Se crearon ${newUsers.length} nuevos usuarios`,
				'success'
			);

			// ✅ Cerrar el modal sin recargar la página

			if (modalIsOpen) {
				setModalIsOpen(false);
			}
		},
		[showNotification, modalIsOpen]
	);

	const handleEditUser = async (user: User) => {
		try {
			// 🔹 Obtener los datos del usuario desde Clerk
			const res = await fetch(`/api/super-admin/infoUserUpdate?id=${user.id}`);
			if (!res.ok) throw new Error('Error al obtener datos del usuario');

			const userData: UserData = (await res.json()) as UserData;

			// ✅ Extraer correctamente `firstName` y `lastName`
			const firstName = userData.firstName ?? user.firstName; // Usa `firstName` desde Clerk si existe
			const lastName = userData.lastName ?? user.lastName; // Usa `lastName` desde Clerk si existe

			// 🔹 Asegurar que los permisos sean un array
			const userWithPermissions = {
				...userData,
				firstName, // ✅ Ahora `firstName` se almacena correctamente
				lastName, // ✅ Ahora `lastName` se almacena correctamente
				permissions: Array.isArray(userData.permissions)
					? userData.permissions
					: [],
			};

			console.log('📌 Usuario con permisos:', userWithPermissions);

			// ✅ Guardar el usuario en el estado para abrir el modal con la info actualizada
			setEditingUser({
				...userWithPermissions,
				role: userWithPermissions.role ?? 'sin-role',
				status: userWithPermissions.status ?? 'sin-status',
			});

			// ✅ Asegurar que los campos de edición se actualicen con `firstName` y `lastName`
			setEditValues({
				firstName,
				lastName,
			});
		} catch (error) {
			console.error('❌ Error al obtener usuario:', error);
		}
	};

	return (
		<SuperAdminLayout>
			{/* 🔎 Barra de Búsqueda y Filtro */}

			<header className="flex items-center justify-between rounded-lg bg-[#00BDD8] p-6 text-3xl font-bold text-[#01142B] shadow-md">
				<h1>Administrador de usuarios</h1>
			</header>
			{/* 🔎 Barra de Búsqueda y Filtro */}

			<div className="p-6">
				<p className="mb-6 text-lg text-white">
					Aquí puedes gestionar los usuarios y sus roles.
				</p>

				{error && (
					<div className="mb-6 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
						<p>{error}</p>
					</div>
				)}

				{loading ? (
					<div className="flex items-center justify-center p-8">
						<Loader2 className="text-primary size-6 animate-spin" />
						<span className="ml-2">Cargando usuarios...</span>
					</div>
				) : (
					<>
						{showCreateForm && (
							<div className="bg-opacity-30 fixed inset-0 z-[9999] flex items-center justify-center bg-black p-4 backdrop-blur-md">
								<div className="relative z-50 w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-2xl">
									{/* Header del formulario con botón de cierre */}
									<div className="mb-4 flex items-center justify-between">
										<h2 className="text-lg font-bold text-white">
											Crear Nuevo Usuario
										</h2>
										<button onClick={() => setShowCreateForm(false)}>
											<X className="size-6 text-gray-300 hover:text-white" />
										</button>
									</div>

									{/* Formulario de creación */}
									<div className="space-y-4">
										<input
											type="text"
											placeholder="Nombre"
											className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
											value={newUser.firstName}
											onChange={(e) =>
												setNewUser({ ...newUser, firstName: e.target.value })
											}
										/>
										<input
											type="text"
											placeholder="Apellido"
											className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
											value={newUser.lastName}
											onChange={(e) =>
												setNewUser({ ...newUser, lastName: e.target.value })
											}
										/>
										<input
											type="email"
											placeholder="Correo electrónico"
											className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
											value={newUser.email}
											onChange={(e) =>
												setNewUser({ ...newUser, email: e.target.value })
											}
										/>
										<select
											className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
											value={newUser.role}
											onChange={(e) =>
												setNewUser({ ...newUser, role: e.target.value })
											}
										>
											<option value="admin">Admin</option>
											<option value="super-admin">super-admin</option>
											<option value="educador">Educador</option>
											<option value="estudiante">Estudiante</option>
										</select>
									</div>

									{/* Botón para crear usuario */}
									<button
										onClick={handleCreateUser}
										className="bg-primary hover:bg-secondary mt-4 flex w-full justify-center rounded-md px-4 py-2 font-bold text-white"
										disabled={creatingUser}
									>
										{creatingUser ? (
											<Loader2 className="size-5 animate-spin" />
										) : (
											'Crear Usuario'
										)}
									</button>
								</div>
							</div>
						)}
						{viewUser && (
							<div className="fixed inset-0 z-[10000] flex items-center justify-center backdrop-blur-md">
								<div className="relative z-50 w-full max-w-5xl rounded-lg bg-[#01142B] p-8 text-white shadow-xl">
									{/* Información del Usuario */}
									<div className="flex">
										{/* Foto de Perfil */}
										<div className="ml-20 h-48 w-48 overflow-hidden rounded-full border-4 border-[#3AF4EF]">
											{viewUser.profileImage ? (
												<img
													src={viewUser.profileImage}
													alt="Foto de perfil"
													className="h-full w-full object-cover"
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center bg-gray-600 text-center text-5xl text-white">
													{viewUser.firstName?.charAt(0)}
												</div>
											)}
										</div>

										{/* Información del Usuario */}
										<div className="ml-80 flex flex-col justify-start space-x-4">
											<p className="text-4xl font-semibold">
												{viewUser.firstName} {viewUser.lastName}
											</p>
											<p className="text-lg text-gray-400">{viewUser.email}</p>
											<p className="mt-2 text-lg">
												<strong>Rol:</strong>{' '}
												<span className="font-bold text-[#3AF4EF]">
													{viewUser.role}
												</span>
											</p>
											<p className="text-lg">
												<strong>Estado:</strong>{' '}
												<span className="font-bold text-[#3AF4EF]">
													{viewUser.status}
												</span>
											</p>
											<p className="text-lg">
												<strong>Fecha de Creación:</strong>{' '}
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

						{showAssignModal && (
							<div className="bg-opacity-30 fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
								<div className="w-full max-w-3xl rounded-lg bg-gray-800 p-6 shadow-2xl">
									{/* Header del Modal */}
									<div className="mb-4 flex items-center justify-between">
										<h2 className="text-lg font-bold text-white">
											Asignar Curso a Estudiantes
										</h2>
										<button onClick={() => setShowAssignModal(false)}>
											<X className="size-6 text-gray-300 hover:text-white" />
										</button>
									</div>

									{/* Contenido Principal */}
									<div className="grid grid-cols-2 gap-4">
										{/* Lista de Estudiantes */}
										{/* Lista de Estudiantes */}
										<div className="rounded-lg bg-gray-700 p-4">
											<h3 className="mb-2 font-semibold text-white">
												Seleccionar Estudiantes
											</h3>

											{/* Checkbox "Seleccionar Todos" */}
											<div className="mb-2 flex items-center justify-between rounded bg-gray-600 px-3 py-2">
												<span className="font-semibold text-white">
													Seleccionar Todos
												</span>
												<input
													type="checkbox"
													checked={
														selectedStudents.length === users.length &&
														users.length > 0
													}
													onChange={(e) => {
														if (e.target.checked) {
															setSelectedStudents(users.map((user) => user.id)); // Selecciona todos
														} else {
															setSelectedStudents([]); // Deselecciona todos
														}
													}}
													className="form-checkbox h-5 w-5 text-blue-500"
												/>
											</div>

											<div className="h-64 overflow-y-auto rounded border border-gray-600">
												{users.map((user) => (
													<label
														key={user.id}
														className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-gray-600"
													>
														<span className="text-white">
															{user.firstName} {user.lastName}
														</span>
														<input
															type="checkbox"
															checked={selectedStudents.includes(user.id)}
															onChange={() => handleSelectStudent(user.id)}
															className="form-checkbox h-5 w-5 text-blue-500"
														/>
													</label>
												))}
											</div>
										</div>

										{/* Lista de Cursos */}
										<div className="rounded-lg bg-gray-700 p-4">
											<h3 className="mb-2 font-semibold text-white">
												Seleccionar Curso
											</h3>
											<div className="h-64 overflow-y-auto rounded border border-gray-600">
												{courses.map((course) => (
													<label
														key={course.id}
														className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-gray-600"
													>
														<span className="text-white">{course.title}</span>
														<input
															type="radio"
															name="selectedCourse"
															checked={selectedCourse === course.id}
															onChange={() => setSelectedCourse(course.id)}
															className="form-radio h-5 w-5 text-blue-500"
														/>
													</label>
												))}
											</div>
										</div>
									</div>

									{/* Botones de Acción */}
									<div className="mt-6 flex justify-between">
										<button
											onClick={handleAssignStudents}
											className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
											disabled={
												selectedStudents.length === 0 || !selectedCourse
											}
										>
											Asignar Estudiantes
										</button>
										<button
											onClick={() => setShowAssignModal(false)}
											className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
										>
											Salir
										</button>
									</div>
								</div>
							</div>
						)}

						{/* Contenedor de botones arriba de la tabla */}
						<div className="mb-4 flex items-center justify-between">
							{/* Contenedor de botones arriba de la tabla */}
							<div className="mb-4 flex space-x-2">
								<button
									onClick={() => handleMassUpdateStatus('activo')}
									className={`flex items-center rounded-md px-4 py-2 font-semibold text-white shadow-md transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
										selectedUsers.length === 0
											? 'cursor-not-allowed bg-gray-500'
											: 'bg-green-500 hover:bg-green-600 focus:bg-green-600'
									}`}
									disabled={selectedUsers.length === 0}
								>
									<Check className="mr-2 size-5" /> Activar
								</button>
								<button
									onClick={() => handleMassUpdateStatus('inactivo')}
									className={`flex items-center rounded-md px-4 py-2 font-semibold text-white shadow-md transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
										selectedUsers.length === 0
											? 'cursor-not-allowed bg-gray-500'
											: 'bg-red-500 hover:bg-red-600 focus:bg-red-600'
									}`}
									disabled={selectedUsers.length === 0}
								>
									<XCircle className="mr-2 size-5" /> Desactivar
								</button>
								<button
									onClick={handleMassRemoveRole}
									className={`flex items-center rounded-md px-4 py-2 font-semibold text-white shadow-md transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
										selectedUsers.length === 0
											? 'cursor-not-allowed bg-gray-500'
											: 'bg-yellow-500 hover:bg-yellow-600 focus:bg-yellow-600'
									}`}
									disabled={selectedUsers.length === 0}
								>
									<XCircle className="mr-2 size-5" /> Quitar Rol
								</button>
								<button
									onClick={() => setShowAssignModal(true)}
									className="bg-secondary hover:bg-primary flex items-center rounded-md px-4 py-2 font-semibold text-white shadow-md transition hover:scale-105"
								>
									Asignar Curso a Estudiantes
								</button>

								<button
									onClick={() => setShowCreateForm(true)}
									className="bg-secondary flex items-center rounded-md px-4 py-2 font-semibold text-white shadow-md transition hover:scale-105 hover:bg-[#00A5C0]"
								>
									<UserPlus className="mr-2 size-5" /> Crear Usuario
								</button>
								<BulkUploadUsers onUsersUploaded={handleMassUserUpload} />
							</div>
						</div>
						<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{/* 🔍 Buscador por Nombre o Correo */}
							<div className="flex items-center gap-2 rounded-lg bg-white p-4 text-black shadow-md">
								<input
									type="text"
									placeholder="Buscar por nombre o correo..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								/>
							</div>

							{/* 🎭 Filtro de Roles */}
							<div className="flex items-center gap-2 rounded-lg bg-white p-4 text-black shadow-md">
								<select
									className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
									value={roleFilter}
									onChange={(e) => setRoleFilter(e.target.value)}
								>
									<option value="">Todos los Roles</option>
									<option value="admin">Admin</option>
									<option value="super-admin">Super-admin</option>
									<option value="educador">Educador</option>
									<option value="estudiante">Estudiante</option>
									<option value="sin-role">Sin Rol</option>
								</select>
							</div>

							{/* ⚡ Filtro de Estado */}
							<div className="flex items-center gap-2 rounded-lg bg-white p-4 text-black shadow-md">
								<select
									className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
								>
									<option value="">Todos los Estados</option>
									<option value="activo">Activo</option>
									<option value="inactivo">Inactivo</option>
									<option value="suspendido">Suspendido</option>
								</select>
							</div>
						</div>

						<div className="mt-6 overflow-x-auto">
							<table className="bg-opacity-70 from-background w-full border-collapse rounded-lg bg-gradient-to-br to-gray-800 text-white shadow-lg backdrop-blur-lg">
								<thead className="from-primary to-secondary rounded-t-lg bg-[#00BDD8] text-[#01142B]">
									<tr>
										<th className="px-4 py-3">
											<input
												type="checkbox"
												onChange={(e) =>
													setSelectedUsers(
														e.target.checked
															? filteredUsers.map((user) => user.id)
															: []
													)
												}
												checked={selectedUsers.length === filteredUsers.length}
											/>
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">
											Nombre
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">
											Correo
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">
											<select
												value={roleFilter}
												onChange={(e) => setRoleFilter(e.target.value)}
												className="rounded-md bg-transparent px-3 py-2 text-sm text-[#01142B]"
											>
												<option value="">Roles</option>
												<option value="admin">Admin</option>
												<option value="super-admin">super-admin</option>
												<option value="educador">Educador</option>
												<option value="estudiante">Estudiante</option>
												<option value="sin-role">Sin Rol</option>
											</select>
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">
											{' '}
											<select
												value={statusFilter}
												onChange={(e) => setStatusFilter(e.target.value)}
												className="rounded-md bg-transparent px-3 py-2 text-sm text-[#01142B]"
											>
												<option value="">Estados</option>
												<option value="activo">Activo</option>
												<option value="inactivo">Inactivo</option>
												<option value="suspendido">Suspendido</option>
											</select>
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
											className={`transition duration-300 hover:bg-gray-800 hover:shadow-lg ${
												user.isNew ? 'bg-primary text-black' : ''
											}`}
										>
											<td className="px-4 py-3">
												<input
													type="checkbox"
													checked={selectedUsers.includes(user.id)} // ✅ Está marcado si el usuario está en `selectedUsers`
													onChange={() => handleUserSelection(user.id)} // ✅ Maneja la selección/deselección del usuario
												/>
											</td>

											<td className="px-4 py-3 text-sm text-gray-300">
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
											<td className="px-4 py-3">
												<select
													className="cursor-pointer rounded-md border-none bg-gray-900 px-2 py-1 text-xs text-gray-200 transition duration-300 hover:bg-gray-800"
													value={user.role || 'sin-role'}
													onChange={(e) =>
														handleRoleChange(user.id, e.target.value)
													}
												>
													<option value="sin-role">Sin Rol</option>
													<option value="admin">Admin</option>
													<option value="super-admin">Super-admin</option>
													<option value="educador">Educador</option>
													<option value="estudiante">Estudiante</option>
												</select>
											</td>
											<td className="px-4 py-3">
												<select
													className="cursor-pointer rounded-md border-none bg-gray-900 px-2 py-1 text-xs text-gray-200 transition duration-300 hover:bg-gray-800"
													value={user.status}
													onChange={(e) =>
														handleStatusChange(user.id, e.target.value)
													}
												>
													<option value="activo">Activo</option>
													<option value="inactivo">Inactivo</option>
													<option value="suspendido">Suspendido</option>
												</select>
											</td>
											<td className="flex space-x-2 px-4 py-3">
												<button
													onClick={() => handleViewUser(user)}
													className="flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium shadow-md transition duration-300 hover:bg-blue-600"
												>
													<Eye size={14} className="mr-1" /> Ver
												</button>

												{editingUser?.id === user.id ? (
													<button
														onClick={handleSaveUser} // ✅ Ya no necesita recibir user.id
														className="flex items-center rounded-md bg-green-500 px-2 py-1 text-xs font-medium shadow-md transition duration-300 hover:bg-green-600"
													>
														<Edit size={14} className="mr-1" /> Guardar
													</button>
												) : (
													<button
														onClick={() => handleEditUser(user)} // ✅ Pasamos el objeto completo
														className="flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium shadow-md transition duration-300 hover:bg-blue-600"
													>
														<Edit size={14} className="mr-1" /> Editar
													</button>
												)}
												<button
													onClick={() => handleDeleteUser(user.id)}
													className="flex items-center rounded-md bg-red-700 px-2 py-1 text-xs font-medium shadow-md transition duration-300 hover:bg-red-800"
												>
													<Trash2 size={14} className="mr-1" /> Eliminar
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
					</>
				)}
			</div>
			{notification && (
				<div
					className={`fixed right-5 bottom-5 rounded-md px-4 py-2 text-white shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
				>
					{notification.message}
				</div>
			)}
			{editingUser && (
				<EditUserModal
					isOpen={!!editingUser}
					user={editingUser} // ✅ Pasamos el usuario completo
					onClose={() => setEditingUser(null)}
					onSave={(updatedUser, updatedPermissions) => {
						setUsers(
							users.map((user) =>
								user.id === updatedUser.id
									? { ...updatedUser, permissions: updatedPermissions }
									: user
							)
						);
						setEditingUser(null);
						showNotification('Usuario actualizado con éxito.', 'success');
					}}
				/>
			)}

			<ConfirmDialog
				isOpen={confirmation?.isOpen ?? false}
				title={confirmation?.title ?? ''}
				message={confirmation?.message ?? ''}
				onConfirm={async () => {
					await Promise.resolve(confirmation?.onConfirm?.());
					setConfirmation(null);
				}}
				onCancel={() => {
					confirmation?.onCancel?.();
					setConfirmation(null);
				}}
			/>

			<ConfirmDialog
				isOpen={confirmation?.isOpen ?? false}
				title={confirmation?.title ?? ''}
				message={confirmation?.message ?? ''}
				onConfirm={
					confirmation?.onConfirm
						? async () => {
								await Promise.resolve(confirmation.onConfirm?.());
							}
						: async () => Promise.resolve()
				} // Asegura que `onConfirm` siempre devuelva una Promise<void>
				onCancel={() => setConfirmation(null)}
			/>

			<InfoDialog
				isOpen={infoDialogOpen}
				title={infoDialogTitle}
				message={infoDialogMessage}
				onClose={() => setInfoDialogOpen(false)}
			/>
		</SuperAdminLayout>
	);
}
