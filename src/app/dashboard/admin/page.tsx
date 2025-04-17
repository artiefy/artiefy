'use client';
import React, { useState, useEffect, useCallback } from 'react';

import { useSearchParams } from 'next/navigation';

import {
	Loader2,
	X,
	Edit,
	Trash2,
	UserPlus,
} from 'lucide-react';

import BulkUploadUsers from '~/app/dashboard/super-admin/components/BulkUploadUsers'; // Ajusta la ruta según la ubicación de tu componente
import { ConfirmDialog } from '~/app/dashboard/super-admin/components/ConfirmDialog';
import { InfoDialog } from '~/app/dashboard/super-admin/components/InfoDialog';
import EditUserModal from '~/app/dashboard/super-admin/users/EditUserModal'; // Ajusta la ruta según la ubicación de tu componente
import { setRoleWrapper, deleteUser } from '~/server/queries/queries';

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
	profileImage?: string;
	createdAt?: string;
	role: string;
	status: string;
	password?: string;
}

interface UserData {
	id: string;
	firstName?: string;
	lastName?: string;
	name?: string;
	email: string;
	profileImage?: string;
	createdAt?: string;
	role?: string;
	status?: string;
	password?: string;
	permissions?: string[];
}

export default function AdminDashboard() {
	const [users, setUsers] = useState<User[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [roleFilter, setRoleFilter] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
	const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
	const [notification, setNotification] = useState<{
		message: string;
		type: 'success' | 'error';
	} | null>(null);
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [editValues, setEditValues] = useState<{
		firstName: string;
		lastName: string;
	}>({ firstName: '', lastName: '' });
	const [infoDialogOpen, setInfoDialogOpen] = useState(false);
	const [infoDialogTitle, setInfoDialogTitle] = useState('');
	const [infoDialogMessage, setInfoDialogMessage] = useState('');

	const [showCreateForm, setShowCreateForm] = useState(false);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const [viewUser, setViewUser] = useState<ViewUserResponse | null>(null);

	const [newUser, setNewUser] = useState({
		firstName: '',
		lastName: '',
		email: '',
		role: 'estudiante',
	});
	const [creatingUser, setCreatingUser] = useState(false);

	const searchParams = useSearchParams();
	const query = searchParams?.get('search') ?? '';
	const [modalIsOpen, setModalIsOpen] = useState(false);

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
						: [],
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

	useEffect(() => {
		void fetchUsers();
	}, [fetchUsers]);

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

			const { user: safeUser, generatedPassword } = rawData as {
				user: { id: string; username: string };
				generatedPassword: string;
			};
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
					isNew: true,
				},
				...users,
			]);

			setInfoDialogTitle('Usuario Creado');
			setInfoDialogMessage(
				`Se ha creado el usuario "${username}" con la contraseña: ${generatedPassword}`
			);
			setInfoDialogOpen(true);

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
				})();
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
				})();
			},
		});
	};

	const handleEditUser = async (user: User) => {
		try {
			const res = await fetch(`/api/super-admin/infoUserUpdate?id=${user.id}`);
			if (!res.ok) throw new Error('Error al obtener datos del usuario');

			const userData: UserData = (await res.json()) as UserData;

			const firstName = userData.firstName ?? user.firstName;
			const lastName = userData.lastName ?? user.lastName;

			const userWithPermissions = {
				...userData,
				firstName,
				lastName,
				permissions: Array.isArray(userData.permissions)
					? userData.permissions
					: [],
			};

			console.log('📌 Usuario con permisos:', userWithPermissions);

			setEditingUser({
				...userWithPermissions,
				role: userWithPermissions.role ?? 'sin-role',
				status: userWithPermissions.status ?? 'sin-status',
			});

			setEditValues({
				firstName,
				lastName,
			});
		} catch (error) {
			console.error('❌ Error al obtener usuario:', error);
		}
	};

	const showNotification = useCallback(
		(message: string, type: 'success' | 'error') => {
			setNotification({ message, type });
			setTimeout(() => setNotification(null), 3000);
		},
		[]
	);

	return (
		<>
			<div className="p-4 sm:p-6">
				<header className="group relative overflow-hidden rounded-lg p-[1px]">
					<div className="animate-gradient absolute -inset-0.5 bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-75 blur transition duration-500" />
					<div className="relative flex flex-col items-start justify-between rounded-lg bg-gray-800 p-4 text-white shadow-lg transition-all duration-300 group-hover:bg-gray-800/95 sm:flex-row sm:items-center sm:p-6">
						<h1 className="text-primary flex items-center gap-3 text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl">
							Administrador de usuarios
						</h1>
					</div>
				</header>
				<br />

				<div className="mb-6 flex flex-wrap gap-2">
					<button
						onClick={() => setShowCreateForm(true)}
						className="group/button bg-background text-primary hover:bg-primary/10 relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-md border border-white/20 px-2 py-1.5 text-xs transition-all sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
					>
						<span className="relative z-10 font-medium">Crear Usuario</span>
						<UserPlus className="relative z-10 size-3.5 sm:size-4" />
						<div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
					</button>

					<BulkUploadUsers
						onUsersUploaded={(newUsers) => {
							setUsers((prevUsers) => [...newUsers, ...prevUsers]);
							showNotification('Usuarios cargados con éxito.', 'success');
						}}
					/>
				</div>

				<div className="mt-6">
					<div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						<div className="rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm">
							<input
								type="text"
								placeholder="Buscar por nombre o correo..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white placeholder:text-gray-400"
							/>
						</div>

						<div className="rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm">
							<select
								className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white"
								value={roleFilter}
								onChange={(e) => setRoleFilter(e.target.value)}
							>
								<option value="">Todos los Roles</option>
								<option value="admin">Admin</option>
								<option value="super-admin">super-admin</option>
								<option value="educador">Educador</option>
								<option value="estudiante">Estudiante</option>
								<option value="sin-role">Sin Rol</option>
							</select>
						</div>

						<div className="rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm">
							<select
								className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white"
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

					<div className="mt-6 overflow-hidden rounded-lg bg-gray-800/50 shadow-xl backdrop-blur-sm">
						<div className="overflow-x-auto">
							<table className="min-w-full table-auto border-collapse">
								<thead>
									<tr className="border-b border-gray-700 bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] text-white">
										<th className="w-12 px-2 py-3 sm:px-4 sm:py-4">
											<input
												type="checkbox"
												checked={selectedUsers.length === users.length}
												onChange={(e) =>
													setSelectedUsers(
														e.target.checked ? users.map((user) => user.id) : []
													)
												}
												className="rounded border-white/20"
											/>
										</th>
										<th className="px-2 py-3 text-left text-xs font-medium whitespace-nowrap sm:px-4 sm:py-4 sm:text-sm">
											Usuario
										</th>
										<th className="px-2 py-3 text-left text-xs font-medium whitespace-nowrap sm:px-4 sm:py-4 sm:text-sm">
											Rol
										</th>
										<th className="px-2 py-3 text-left text-xs font-medium whitespace-nowrap sm:px-4 sm:py-4 sm:text-sm">
											Estado
										</th>
										<th className="px-2 py-3 text-right text-xs font-medium whitespace-nowrap sm:px-4 sm:py-4 sm:text-sm">
											Acciones
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-700/50">
									{users.map((user) => (
										<tr
											key={user.id}
											className="group transition-colors hover:bg-gray-700/50"
										>
											<td className="px-2 py-3 sm:px-4 sm:py-4">
												<input
													type="checkbox"
													checked={selectedUsers.includes(user.id)}
													onChange={() =>
														setSelectedUsers((prev) =>
															prev.includes(user.id)
																? prev.filter((id) => id !== user.id)
																: [...prev, user.id]
														)
													}
													className="rounded border-gray-600"
												/>
											</td>
											<td className="px-2 py-3 sm:px-4 sm:py-4">
												<div className="flex items-center gap-2 sm:gap-3">
													<div className="bg-primary/10 size-8 rounded-full p-1 sm:size-10 sm:p-2">
														<span className="text-primary flex h-full w-full items-center justify-center text-xs font-semibold sm:text-sm">
															{user.firstName[0]}
															{user.lastName[0]}
														</span>
													</div>
													<div>
														<div className="text-xs font-medium text-white sm:text-sm">
															{user.firstName} {user.lastName}
														</div>
														<div className="text-xs text-gray-400 sm:text-sm">
															{user.email}
														</div>
													</div>
												</div>
											</td>
											<td className="px-2 py-3 sm:px-4 sm:py-4">
												<select
													value={user.role || 'sin-role'}
													onChange={(e) =>
														handleRoleChange(user.id, e.target.value)
													}
													className="w-full rounded-md border border-gray-600 bg-gray-700/50 px-2 py-1 text-xs text-white transition-colors hover:bg-gray-700 sm:px-3 sm:text-sm"
												>
													<option value="sin-role">Sin Rol</option>
													<option value="admin">Admin</option>
													<option value="super-admin">super-admin</option>
													<option value="educador">Educador</option>
													<option value="estudiante">Estudiante</option>
												</select>
											</td>
											<td className="px-2 py-3 sm:px-4 sm:py-4">
												<div
													className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
														user.status === 'activo'
															? 'bg-green-500/10 text-green-500'
															: user.status === 'inactivo'
																? 'bg-red-500/10 text-red-500'
																: 'bg-yellow-500/10 text-yellow-500'
													}`}
												>
													<div
														className={`mr-1 size-1.5 rounded-full sm:size-2 ${
															user.status === 'activo'
																? 'bg-green-500'
																: user.status === 'inactivo'
																	? 'bg-red-500'
																	: 'bg-yellow-500'
														}`}
													/>
													<span className="hidden sm:inline">
														{user.status}
													</span>
													<span className="inline sm:hidden">
														{user.status === 'activo'
															? 'A'
															: user.status === 'inactivo'
																? 'I'
																: 'S'}
													</span>
												</div>
											</td>
											<td className="px-2 py-3 sm:px-4 sm:py-4">
												<div className="flex items-center justify-end gap-1 sm:gap-2">
													<button
														onClick={() => handleEditUser(user)}
														className="rounded-md p-1 hover:bg-gray-700"
														title="Editar"
													>
														<Edit className="size-3.5 sm:size-4" />
													</button>
													<button
														onClick={() => handleDeleteUser(user.id)}
														className="rounded-md p-1 hover:bg-red-500/10 hover:text-red-500"
														title="Eliminar"
													>
														<Trash2 className="size-3.5 sm:size-4" />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

			{showCreateForm && (
				<div className="bg-opacity-30 fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
					<div className="relative z-50 w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-2xl">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-lg font-bold text-white">
								Crear Nuevo Usuario
							</h2>
							<button onClick={() => setShowCreateForm(false)}>
								<X className="size-6 text-gray-300 hover:text-white" />
							</button>
						</div>

						<div className="space-y-4">
							<input
								type="text"
								placeholder="Nombre"
								className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
								value={newUser.firstName}
								onChange={(e) => {
									const singleName = e.target.value.trim().split(' ')[0];
									setNewUser({ ...newUser, firstName: singleName });
								}}
								onKeyDown={(e) => {
									if (e.key === ' ') {
										e.preventDefault();
									}
								}}
								maxLength={30}
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

			{editingUser && (
				<EditUserModal
					isOpen={!!editingUser}
					user={editingUser}
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
				onConfirm={
					confirmation?.onConfirm
						? async () => {
								await Promise.resolve(confirmation.onConfirm?.());
							}
						: async () => Promise.resolve()
				}
				onCancel={() => setConfirmation(null)}
			/>

			<InfoDialog
				isOpen={infoDialogOpen}
				title={infoDialogTitle}
				message={infoDialogMessage}
				onClose={() => setInfoDialogOpen(false)}
			/>

			{notification && (
				<div
					className={`fixed right-5 bottom-5 rounded-md px-4 py-2 text-white shadow-lg ${
						notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
					}`}
				>
					{notification.message}
				</div>
			)}
		</>
	);
}
