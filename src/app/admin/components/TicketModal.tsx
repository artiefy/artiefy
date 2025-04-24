import React, { useState, useEffect } from 'react';
import { Modal } from '~/components/shared/Modal';
interface TicketModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: any) => void;
	ticket?: any;
}
const TicketModal = ({
	isOpen,
	onClose,
	onSubmit,
	ticket,
}: TicketModalProps) => {
	const initialFormState = {
		email: '',
		tipo: '',
		estado: '',
		assignedToId: '',
		description: '',
		comments: '',
	};

	const [formData, setFormData] = useState(initialFormState);

	useEffect(() => {
		if (ticket) {
			setFormData({
				email: ticket.email || '',
				tipo: ticket.tipo || '',
				estado: ticket.estado || '',
				assignedToId: ticket.assignedToId || '',
				description: ticket.description || '',
				comments: ticket.comments || '',
			});
		} else {
			setFormData(initialFormState);
		}
	}, [ticket, isOpen]);

	const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

	useEffect(() => {
		// Fetch users from API or other source
		const fetchUsers = async () => {
			const response = await fetch('/api/users');
			const data = await response.json();
			setUsers(data);
		};

		fetchUsers();
	}, []);

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>
	) => {
		const { name, value } = e.target;
		setFormData((prevData) => ({
			...prevData,
			[name]: value,
		}));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formData);
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={ticket ? 'Editar Ticket' : 'Crear Ticket'}
		>
			<form
				onSubmit={handleSubmit}
				className="max-h-[calc(100vh-200px)] overflow-y-auto"
			>
				<div className="grid grid-cols-1 gap-x-6 gap-y-4 p-1 md:grid-cols-2">
					{/* Columna izquierda */}
					<div>
						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-200">
								Asignar a
								<select
									name="assignedToId"
									value={formData.assignedToId}
									onChange={handleInputChange}
									className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 text-white shadow-sm"
								>
									<option value="">
										{ticket?.assignedToName || 'Seleccionar usuario'}
									</option>
									{users.map((user) => (
										<option key={user.id} value={user.id}>
											{user.name}
										</option>
									))}
								</select>
							</label>
						</div>
						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-200">
								Email de contacto
								<input
									type="email"
									name="email"
									value={formData.email}
									onChange={handleInputChange}
									className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 text-white shadow-sm"
									required
								/>
							</label>
						</div>
						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-200">
								Tipo de Solicitud
								<select
									name="tipo"
									value={formData.tipo}
									onChange={handleInputChange}
									className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 text-white shadow-sm"
									required
								>
									<option value="">Seleccionar tipo</option>
									<option value="bug">Bug</option>
									<option value="revision">Revisión</option>
									<option value="logs">Logs</option>
									<option value="otro">Otro</option>
								</select>
							</label>
						</div>
					</div>

					{/* Columna derecha */}
					<div>
						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-200">
								Estado
								<select
									name="estado"
									value={formData.estado}
									onChange={handleInputChange}
									className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 text-white shadow-sm"
									required
								>
									<option value="">Seleccionar estado</option>
									<option value="abierto">Abierto</option>
									<option value="en proceso">En Proceso</option>
									<option value="en revision">En Revisión</option>
									<option value="solucionado">Solucionado</option>
									<option value="cerrado">Cerrado</option>
								</select>
							</label>
						</div>
						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-200">
								Descripción
								<textarea
									name="description"
									value={formData.description}
									onChange={handleInputChange}
									rows={3}
									className="mt-1 block w-full resize-none rounded-md border border-gray-600 bg-gray-800 text-white shadow-sm"
									required
								/>
							</label>
						</div>
						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-200">
								Comentarios
								<textarea
									name="comments"
									value={formData.comments}
									onChange={handleInputChange}
									rows={3}
									className="mt-1 block w-full resize-none rounded-md border border-gray-600 bg-gray-800 text-white shadow-sm"
								/>
							</label>
						</div>
					</div>
				</div>

				<div className="mt-4 flex justify-end space-x-3 border-t border-gray-700 pt-4">
					<button
						type="button"
						onClick={onClose}
						className="rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
					>
						Cancelar
					</button>
					<button
						type="submit"
						className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
					>
						{ticket ? 'Guardar Cambios' : 'Crear Ticket'}
					</button>
				</div>
			</form>
		</Modal>
	);
};

export default TicketModal;
