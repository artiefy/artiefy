'use client';

import { useEffect, useState } from 'react';

import { toast } from 'sonner';

interface Permiso {
	id: number;
	name: string;
	description: string;
	servicio: string;
	accion:
		| 'create'
		| 'read'
		| 'update'
		| 'delete'
		| 'approve'
		| 'assign'
		| 'publish';
}

export default function PermisosTab() {
	const [permisos, setPermisos] = useState<Permiso[]>([]);
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [newPermiso, setNewPermiso] = useState({
		name: '',
		description: '',
		servicio: '',
		accion: 'read',
	});

	const [updatingId, setUpdatingId] = useState<number | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	useEffect(() => {
		const fetchPermisos = async () => {
			try {
				const res = await fetch('/api/super-admin/permisos/list');
				if (!res.ok) throw new Error('Error al obtener permisos');
				const data = (await res.json()) as Permiso[];
				setPermisos(data);
			} catch {
				toast.error('No se pudieron cargar los permisos');
			} finally {
				setLoading(false);
			}
		};

		void fetchPermisos(); // evitar warning por promesa no manejada
	}, []);

	const handleCreate = async () => {
		try {
			const res = await fetch('/api/super-admin/permisos/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newPermiso),
			});
			if (!res.ok) throw new Error();
			const created = (await res.json()) as Permiso;
			setPermisos((prev) => [...prev, created]);
			setNewPermiso({
				name: '',
				description: '',
				servicio: '',
				accion: 'read',
			});
			setIsModalOpen(false);
			toast.success('Permiso creado');
		} catch {
			toast.error('Error al crear permiso');
		}
	};

	const handleUpdate = async (permiso: Permiso) => {
		setUpdatingId(permiso.id);
		try {
			const res = await fetch('/api/super-admin/permisos/update', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(permiso),
			});
			if (!res.ok) throw new Error();
			const updated = (await res.json()) as Permiso;
			setPermisos((prev) =>
				prev.map((p) => (p.id === updated.id ? updated : p))
			);
			toast.success('Permiso actualizado');
		} catch {
			toast.error('Error al actualizar permiso');
		} finally {
			setUpdatingId(null);
		}
	};

	const handleDelete = async (id: number) => {
		const confirm = window.confirm(
			'¿Estás seguro de que quieres eliminar este permiso?'
		);
		if (!confirm) return;

		setDeletingId(id);
		try {
			const res = await fetch('/api/super-admin/permisos/delete', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id }),
			});
			if (!res.ok) throw new Error();
			setPermisos((prev) => prev.filter((p) => p.id !== id));
			toast.success('Permiso eliminado');
		} catch {
			toast.error('Error al eliminar permiso');
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div className="rounded-lg border border-white/10 bg-gray-800/60 p-4 text-white shadow-md">
			<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="text-lg font-bold">Permisos del Sistema</h2>
				<button
					onClick={() => setIsModalOpen(true)}
					className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
				>
					+ Nuevo Permiso
				</button>
			</div>

			{loading ? (
				<div className="text-center text-white">Cargando permisos...</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full table-auto text-sm">
						<thead className="sticky top-0 bg-gray-900 text-left text-gray-400 shadow-md">
							<tr>
								<th className="px-4 py-2">Nombre</th>
								<th className="px-4 py-2">Descripción</th>
								<th className="px-4 py-2">Servicio</th>
								<th className="px-4 py-2">Acción</th>
								<th className="px-4 py-2">Acciones</th>
							</tr>
						</thead>
						<tbody>
							{permisos.map((permiso) => (
								<tr
									key={permiso.id}
									className="border-t border-white/10 hover:bg-gray-700/30"
								>
									<td className="px-4 py-2">
										<input
											type="text"
											value={permiso.name}
											onChange={(e) =>
												setPermisos((prev) =>
													prev.map((p) =>
														p.id === permiso.id
															? { ...p, name: e.target.value }
															: p
													)
												)
											}
											className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
										/>
									</td>
									<td className="px-4 py-2">
										<input
											type="text"
											value={permiso.description}
											onChange={(e) =>
												setPermisos((prev) =>
													prev.map((p) =>
														p.id === permiso.id
															? { ...p, description: e.target.value }
															: p
													)
												)
											}
											className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
										/>
									</td>
									<td className="px-4 py-2">
										<input
											type="text"
											value={permiso.servicio}
											onChange={(e) =>
												setPermisos((prev) =>
													prev.map((p) =>
														p.id === permiso.id
															? { ...p, servicio: e.target.value }
															: p
													)
												)
											}
											className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
										/>
									</td>
									<td className="px-4 py-2">
										<select
											value={permiso.accion}
											onChange={(e) =>
												setPermisos((prev) =>
													prev.map((p) =>
														p.id === permiso.id
															? {
																	...p,
																	accion: e.target.value as Permiso['accion'],
																}
															: p
													)
												)
											}
											className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
										>
											<option value="create">Crear</option>
											<option value="read">Leer</option>
											<option value="update">Actualizar</option>
											<option value="delete">Eliminar</option>
											<option value="approve">Aprobar</option>
											<option value="assign">Asignar</option>
											<option value="publish">Publicar</option>
										</select>
									</td>
									<td className="flex flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center">
										<button
											onClick={() => handleUpdate(permiso)}
											className="flex items-center justify-center rounded bg-green-600 px-3 py-1 text-white transition hover:bg-green-700 disabled:opacity-50"
											disabled={updatingId === permiso.id}
										>
											{updatingId === permiso.id
												? 'Guardando...'
												: 'Actualizar'}
										</button>
										<button
											onClick={() => handleDelete(permiso.id)}
											className="flex items-center justify-center rounded bg-red-600 px-3 py-1 text-white transition hover:bg-red-700 disabled:opacity-50"
											disabled={deletingId === permiso.id}
										>
											{deletingId === permiso.id ? 'Eliminando...' : 'Eliminar'}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-md rounded bg-gray-900 p-6 text-white shadow-lg">
						<div className="mb-4 flex items-center justify-between border-b pb-2">
							<h2 className="text-lg font-semibold">Crear Permiso</h2>
							<button
								onClick={() => setIsModalOpen(false)}
								className="text-xl text-red-400 hover:text-red-600"
							>
								×
							</button>
						</div>
						<div className="flex flex-col gap-4">
							<input
								type="text"
								placeholder="Nombre"
								value={newPermiso.name}
								onChange={(e) =>
									setNewPermiso({ ...newPermiso, name: e.target.value })
								}
								className="rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
							<input
								type="text"
								placeholder="Descripción"
								value={newPermiso.description}
								onChange={(e) =>
									setNewPermiso({ ...newPermiso, description: e.target.value })
								}
								className="rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
							<input
								type="text"
								placeholder="Servicio (ej. cursos)"
								value={newPermiso.servicio}
								onChange={(e) =>
									setNewPermiso({ ...newPermiso, servicio: e.target.value })
								}
								className="rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>

							<select
								value={newPermiso.accion}
								onChange={(e) =>
									setNewPermiso({
										...newPermiso,
										accion: e.target.value as Permiso['accion'],
									})
								}
								className="rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
							>
								<option value="create">Crear</option>
								<option value="read">Leer</option>
								<option value="update">Actualizar</option>
								<option value="delete">Eliminar</option>
								<option value="approve">Aprobar</option>
								<option value="assign">Asignar</option>
								<option value="publish">Publicar</option>
							</select>

							<button
								onClick={handleCreate}
								className="self-end rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
							>
								Crear Permiso
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
