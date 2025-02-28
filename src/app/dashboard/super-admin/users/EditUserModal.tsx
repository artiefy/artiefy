import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { updateUserInClerk } from '~/server/queries/queries'; // 🔹 Importa la función para actualizar en Clerk

interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: string;
	status: string;
	createdAt?: string;
	permissions?: string[];
}

interface EditUserModalProps {
	isOpen: boolean;
	user: User | null;
	onClose: () => void;
	onSave: (updatedUser: User, updatedPermissions: string[]) => void;
}

const AVAILABLE_PERMISSIONS: string[] = [
	'manage_users',
	'view_reports',
	'edit_content',
	'delete_content',
	'manage_courses',
	'assign_roles',
	'moderate_forums',
	'access_financials',
	'export_data',
	'manage_settings',
	'create_announcements',
	'schedule_events',
	'view_sensitive_data',
	'issue_refunds',
	'manage_subscriptions',
	'send_notifications',
	'manage_support_tickets',
	'configure_integrations',
	'access_developer_tools',
	'override_permissions',
];

export default function EditUserModal({
	isOpen,
	user,
	onClose,
	onSave,
}: EditUserModalProps) {
	const [updatedUser, setUpdatedUser] = useState<User | null>(null);
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

	// 🔹 Se ejecuta cuando el modal se abre o cambia de usuario
	useEffect(() => {
		if (user) {
			setUpdatedUser(user);
			setSelectedPermissions(user.permissions ?? []);

			// ✅ Verificar si los permisos llegan correctamente
			console.log('📌 Permisos del usuario desde Clerk:', user.permissions);
			console.log('📌 Lista completa de permisos:', AVAILABLE_PERMISSIONS);
		}
	}, [user]);

	// ⛔ Evita renderizar si el modal no está abierto
	if (!isOpen || !updatedUser) return null;

	const handlePermissionChange = (permission: string) => {
		setSelectedPermissions((prevPermissions) =>
			prevPermissions.includes(permission)
				? prevPermissions.filter((p) => p !== permission)
				: [...prevPermissions, permission]
		);
	};

	const handleSave = async () => {
		if (!updatedUser.firstName.trim() || !updatedUser.lastName.trim()) {
			alert('El nombre y apellido son obligatorios.');
			return;
		}

		try {
			// 🔹 Llamamos a la API para actualizar en Clerk
			const response = await fetch('/api/super-admin/udateUser', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: updatedUser.id,
					firstName: updatedUser.firstName,
					lastName: updatedUser.lastName,
					role: updatedUser.role,
					status: updatedUser.status,
					permissions: selectedPermissions,
				}),
			});

			const result: { error?: string } = (await response.json()) as {
				error?: string;
			};
			if (!response.ok) {
				throw new Error(
					(result as { error?: string }).error ??
						'Error al actualizar usuario en Clerk'
				);
			}

			console.log('✅ Usuario actualizado correctamente:', result);

			// 🔹 Llamamos a la función `onSave` para actualizar en el estado global
			onSave(updatedUser, selectedPermissions);
			onClose(); // Cerrar modal
		} catch (error) {
			console.error('❌ Error al guardar cambios:', error);
			alert('Hubo un error al actualizar el usuario.');
		}
	};

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md">
			<div className="flex max-h-[70vh] w-full max-w-4xl flex-col rounded-lg bg-gray-900 text-white shadow-lg">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
					<h2 className="text-xl font-bold">Editar Usuario</h2>
					<button onClick={onClose}>
						<X className="text-gray-400 hover:text-white" />
					</button>
				</div>

				{/* Contenedor con scroll */}
				<div className="flex-1 overflow-y-auto px-6 py-4">
					{/* Formulario */}
					<div className="space-y-4">
						<label className="block">
							<span className="text-gray-300">Nombre</span>
							<input
								type="text"
								value={updatedUser.firstName}
								onChange={(e) =>
									setUpdatedUser({ ...updatedUser, firstName: e.target.value })
								}
								className="w-full rounded-md bg-gray-800 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
							/>
						</label>

						<label className="block">
							<span className="text-gray-300">Apellido</span>
							<input
								type="text"
								value={updatedUser.lastName}
								onChange={(e) =>
									setUpdatedUser({ ...updatedUser, lastName: e.target.value })
								}
								className="w-full rounded-md bg-gray-800 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
							/>
						</label>

						<label className="block">
							<span className="text-gray-300">Correo Electrónico</span>
							<input
								type="email"
								value={updatedUser.email}
								disabled
								className="w-full rounded-md bg-gray-700 px-3 py-2 text-gray-400"
							/>
						</label>

						<label className="block">
							<span className="text-gray-300">Rol</span>
							<select
								value={updatedUser.role}
								onChange={(e) =>
									setUpdatedUser({ ...updatedUser, role: e.target.value })
								}
								className="w-full rounded-md bg-gray-800 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
							>
								<option value="admin">Admin</option>
								<option value="super-admin">Super Admin</option>
								<option value="educador">Educador</option>
								<option value="estudiante">Estudiante</option>
								<option value="moderador">Moderador</option>
								<option value="soporte">Soporte</option>
							</select>
						</label>

						<label className="block">
							<span className="text-gray-300">Estado</span>
							<select
								value={updatedUser.status}
								onChange={(e) =>
									setUpdatedUser({ ...updatedUser, status: e.target.value })
								}
								className="w-full rounded-md bg-gray-800 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
							>
								<option value="activo">Activo</option>
								<option value="inactivo">Inactivo</option>
								<option value="suspendido">Suspendido</option>
							</select>
						</label>

						{updatedUser.role !== 'estudiante' && (
							<div>
								<h3 className="text-gray-300">Permisos en Clerk</h3>
								{selectedPermissions.length === 0 && (
									<p className="text-sm text-gray-400">
										Este usuario no tiene permisos asignados.
									</p>
								)}
								<div className="mt-2 flex flex-wrap gap-2">
									{AVAILABLE_PERMISSIONS.map((permission) => (
										<label
											key={permission}
											className="flex items-center space-x-2"
										>
											<input
												type="checkbox"
												checked={selectedPermissions.includes(permission)}
												onChange={() => handlePermissionChange(permission)}
												className="form-checkbox text-blue-500"
											/>
											<span className="text-gray-300">{permission}</span>
										</label>
									))}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Botones */}
				<div className="flex justify-end space-x-3 border-t border-gray-700 bg-gray-900 px-6 py-4">
					<button
						onClick={onClose}
						className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
					>
						Cancelar
					</button>
					<button
						onClick={handleSave}
						className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					>
						Guardar Cambios
					</button>
				</div>
			</div>
		</div>
	);
}
