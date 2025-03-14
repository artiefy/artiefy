'use client';
import { useState, useEffect } from 'react';
import { Button } from '~/components/estudiantes/ui/button';
import {
	setRoleWrapper,
} from '~/server/wrappers/serverWrappers';

interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: string;
}

export default function RolesPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchUsers() {
			try {
				const res = await fetch('/api/users'); // 🔥 Conectar con API real
				const data: User[] = await res.json() as User[];
				setUsers(data);
			} catch {
				setError('Error al cargar los usuarios');
			} finally {
				setLoading(false);
			}
		}
		void fetchUsers();
	}, []);

	const handleRoleChange = async (userId: string, newRole: string) => {
		try {
			const formData = new FormData();
			formData.append('id', userId);
			formData.append('role', newRole);

			await setRoleWrapper(formData);
			setUsers(
				users.map((user) =>
					user.id === userId ? { ...user, role: newRole } : user
				)
			);
		} catch {
			setError('Error al actualizar el rol');
		}
	};

	return (
		<>
			<h1 className="mb-4 text-2xl font-bold">Gestión de Roles</h1>

			{error && <p className="text-red-500">{error}</p>}

			{loading ? (
				<p>Cargando...</p>
			) : (
				<table className="w-full border-collapse border border-gray-200">
					<thead>
						<tr className="bg-gray-100">
							<th className="border p-2">Nombre</th>
							<th className="border p-2">Correo</th>
							<th className="border p-2">Rol</th>
							<th className="border p-2">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{users.map((user) => (
							<tr key={user.id} className="border text-center">
								<td className="border p-2">
									{user.firstName} {user.lastName}
								</td>
								<td className="border p-2">{user.email}</td>
								<td className="border p-2">
									<select
										className="rounded border p-1"
										value={user.role}
										onChange={(e) => handleRoleChange(user.id, e.target.value)}
									>
										<option value="admin">Admin</option>
										<option value="educador">Educador</option>
										<option value="estudiante">Estudiante</option>
									</select>
								</td>
								<td className="border p-2">
									<Button
										className="bg-red-600 text-white hover:bg-red-700"
										onClick={() => handleRoleChange(user.id, '')}
									>
										Eliminar Rol
									</Button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</>
	);
}
