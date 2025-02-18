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
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
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
} | null;

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
	const [editingUser, setEditingUser] = useState<string | null>(null);
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
	const fetchUsers = useCallback(async () => {
		try {
			const res = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
			if (!res.ok) throw new Error('Error al cargar usuarios');

			const rawData: unknown = await res.json();
			if (!Array.isArray(rawData)) throw new Error('Datos inválidos recibidos');

			const data: User[] = rawData
				.filter(
					(item): item is User =>
						typeof item === 'object' &&
						item !== null &&
						'id' in item &&
						'firstName' in item &&
						'lastName' in item &&
						'email' in item &&
						'role' in item &&
						'status' in item
				)
				.map((item) => ({
					id: String(item.id),
					firstName: String(item.firstName),
					lastName: String(item.lastName),
					email: String(item.email),
					role: String(item.role),
					status: String(item.status),
				}));

			setUsers(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error desconocido');
			console.error('Error fetching users:', err);
		} finally {
			setLoading(false);
		}
	}, [query]); // 👈 Ahora `query` es una dependencia estable y segura

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

	const handleSaveUser = (userId: string) => {
		if (updatingUserId === null) return; // Evita que sea null

		void (async () => {
			try {
				setUpdatingUserId(userId);
				await updateUserInfo(userId, editValues.firstName, editValues.lastName);

				setUsers(
					users.map((user) =>
						user.id === userId
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
				setEditingUser(null);
			}
		})(); // ✅ Ejecutamos la función inmediatamente
	};
	const [modalIsOpen, setModalIsOpen] = useState(false); // ✅ Asegurar que está definido

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

	const handleEditUser = (user: User) => {
		setEditingUser(user.id);
		setEditValues({ firstName: user.firstName, lastName: user.lastName });
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
												{editingUser === user.id ? (
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
												{editingUser === user.id ? (
													<button
														onClick={() => handleSaveUser(user.id)}
														className="flex items-center rounded-md bg-green-500 px-2 py-1 text-xs font-medium shadow-md transition duration-300 hover:bg-green-600"
													>
														<Edit size={14} className="mr-1" /> Guardar
													</button>
												) : (
													<button
														onClick={() => handleEditUser(user)}
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
