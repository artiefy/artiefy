'use client';

import { useState, useEffect, useMemo } from 'react';

import { useUser } from '@clerk/nextjs';
import { X, Loader2 } from 'lucide-react';

import { Modal } from '~/components/shared/Modal';

// src/types/tickets.ts

export interface Ticket {
	id: string;
	email: string;
	description: string;
	tipo: string;
	estado: string;
	assignedToName?: string;
	assignedToEmail?: string;
	creatorName?: string;
	creatorEmail?: string;
	comments?: string;
	assignedToId?: string; // <- lo agregamos aquí también
	coverImageKey?: string;
	creatorId?: string;
}

export interface TicketFormData {
	email: string;
	description: string;
	tipo: string;
	estado: string;
	assignedToId?: string; // <- y aquí también
	comments?: string;
	coverImageKey?: string;
	newComment?: string;
}

export interface AdminUser {
	id: string;
	name: string;
	email: string;
	role: string;
}

export interface Comment {
	id: number;
	content: string;
	createdAt: string;
	user: {
		name: string;
	};
}

interface TicketModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: TicketFormData) => void;
	ticket?: Ticket | null;
}

export default function TicketModal({
	isOpen,
	onClose,
	onSubmit,
	ticket,
}: TicketModalProps) {
	const { user } = useUser();

	const initialFormState = useMemo<TicketFormData>(
		() => ({
			assignedToId: '',
			email: '',
			description: '',
			comments: '',
			estado: 'abierto',
			tipo: 'otro',
			coverImageKey: '',
			newComment: '',
		}),
		[]
	);

	const [formData, setFormData] = useState<TicketFormData>(initialFormState);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [admins, setAdmins] = useState<AdminUser[]>([]);
	const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
	const [comments, setComments] = useState<Comment[]>([]);
	const [isLoadingComments, setIsLoadingComments] = useState(false);

	useEffect(() => {
		const fetchAdmins = async () => {
			try {
				setIsLoadingAdmins(true);
				const response = await fetch('/api/admin/users/admins');
				if (!response.ok) throw new Error('Failed to fetch admins');
				const data = (await response.json()) as AdminUser[];
				setAdmins(data);
			} catch (error) {
				console.error('Error loading admins:', error);
			} finally {
				setIsLoadingAdmins(false);
			}
		};

		if (isOpen) void fetchAdmins();
	}, [isOpen]);

	useEffect(() => {
		if (ticket) {
			setFormData({
				assignedToId: ticket.assignedToId ?? '',
				email: ticket.email ?? '',
				description: ticket.description ?? '',
				comments: ticket.comments ?? '',
				estado: ticket.estado ?? 'abierto',
				tipo: ticket.tipo ?? 'otro',
				coverImageKey: ticket.coverImageKey ?? '',
				newComment: '',
			});
		} else {
			setFormData(initialFormState);
		}
	}, [ticket, initialFormState]);

	useEffect(() => {
		const fetchComments = async () => {
			if (isOpen && ticket?.id) {
				setIsLoadingComments(true);
				try {
					const response = await fetch(
						`/api/admin/tickets/${ticket.id}/comments`
					);
					if (!response.ok) throw new Error('Failed to fetch comments');
					const data = (await response.json()) as Comment[];
					setComments(data);
				} catch (error) {
					console.error('Error fetching comments:', error);
				} finally {
					setIsLoadingComments(false);
				}
			}
		};

		void fetchComments();
	}, [isOpen, ticket?.id]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!user) return;

		setIsSubmitting(true);

		const submitData = { ...formData };
		if (!submitData.assignedToId) {
			delete submitData.assignedToId;
		}

		await Promise.resolve(onSubmit(submitData));

		setIsSubmitting(false);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={
				<span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
					{ticket ? 'Editar Ticket' : 'Crear Nuevo Ticket'}
				</span>
			}
		>
			<button
				onClick={onClose}
				className="absolute top-4 right-4 text-gray-400 transition-colors hover:text-white"
				aria-label="Close modal"
			>
				<X size={24} />
			</button>

			<form
				onSubmit={handleSubmit}
				className="grid grid-cols-1 gap-6 px-2 pt-2 md:grid-cols-2"
			>
				{/* Columna izquierda */}
				<div className="space-y-6">
					{ticket?.creatorName && (
						<div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4 shadow-inner">
							<p className="text-sm text-gray-400">
								Creado por:{' '}
								<span className="font-semibold text-white">
									{ticket.creatorName}
								</span>
							</p>
						</div>
					)}

					{/* Asignar a */}
					<div>
						<label className="block text-sm font-semibold text-gray-300">
							Asignar a
						</label>
						<select
							value={formData.assignedToId}
							onChange={(e) =>
								setFormData({ ...formData, assignedToId: e.target.value })
							}
							className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white transition focus:ring-2 focus:ring-blue-500"
							disabled={isLoadingAdmins}
						>
							<option value="">Sin asignar</option>
							{admins.map((admin) => (
								<option key={admin.id} value={admin.id}>
									{admin.name} ({admin.role})
								</option>
							))}
						</select>
					</div>

					{/* Email */}
					<div>
						<label className="block text-sm font-semibold text-gray-300">
							Email de contacto
						</label>
						<input
							type="email"
							value={formData.email}
							onChange={(e) =>
								setFormData({ ...formData, email: e.target.value })
							}
							className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white transition focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					{/* Tipo */}
					<div>
						<label className="block text-sm font-semibold text-gray-300">
							Tipo de Solicitud
						</label>
						<select
							value={formData.tipo}
							onChange={(e) =>
								setFormData({ ...formData, tipo: e.target.value })
							}
							className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white transition focus:ring-2 focus:ring-blue-500"
							required
						>
							<option value="otro">Otro</option>
							<option value="bug">Bug</option>
							<option value="revision">Revisión</option>
							<option value="logs">Logs</option>
						</select>
					</div>
				</div>

				{/* Columna derecha */}
				<div className="space-y-6">
					{/* Estado */}
					<div>
						<label className="block text-sm font-semibold text-gray-300">
							Estado
						</label>
						<select
							value={formData.estado}
							onChange={(e) =>
								setFormData({ ...formData, estado: e.target.value })
							}
							className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white transition focus:ring-2 focus:ring-blue-500"
							required
						>
							<option value="abierto">Abierto</option>
							<option value="en proceso">En Proceso</option>
							<option value="en revision">En Revisión</option>
							<option value="solucionado">Solucionado</option>
							<option value="cerrado">Cerrado</option>
						</select>
					</div>

					{/* Descripción */}
					<div>
						<label className="block text-sm font-semibold text-gray-300">
							Descripción
						</label>
						<textarea
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							rows={3}
							className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white transition focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					{/* Comentarios */}
					<div>
						<label className="block text-sm font-semibold text-gray-300">
							Comentarios
						</label>
						<textarea
							value={formData.comments}
							onChange={(e) =>
								setFormData({ ...formData, comments: e.target.value })
							}
							rows={3}
							className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white transition focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				{/* New Comment Section */}
				<div className="col-span-1 space-y-4 border-t border-gray-700 pt-4 md:col-span-2">
					<div>
						<label className="block text-sm font-medium text-gray-300">
							Agregar Comentario
						</label>
						<textarea
							value={formData.newComment}
							onChange={(e) =>
								setFormData({ ...formData, newComment: e.target.value })
							}
							rows={3}
							className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white shadow-sm"
							placeholder="Escribe un nuevo comentario..."
						/>
					</div>

					{/* Comment History */}
					{ticket && (
						<div className="space-y-2">
							<h3 className="text-sm font-medium text-gray-300">
								Historial de Comentarios
							</h3>
							<div className="max-h-60 space-y-3 overflow-y-auto rounded-md border border-gray-700 bg-gray-800/50 p-4">
								{isLoadingComments ? (
									<div className="flex items-center justify-center py-4">
										<Loader2 className="h-6 w-6 text-blue-500" />
									</div>
								) : comments.length > 0 ? (
									comments.map((comment, index) => (
										<div
											key={index}
											className="rounded-lg border border-gray-700 bg-gray-800 p-3"
										>
											<div className="flex items-center justify-between text-sm">
												<span className="font-medium text-blue-400">
													{comment.user?.name || 'Usuario'}
												</span>
												<span className="text-gray-500">
													{new Date(comment.createdAt).toLocaleString()}
												</span>
											</div>
											<p className="mt-2 text-sm text-gray-300">
												{comment.content}
											</p>
										</div>
									))
								) : (
									<p className="text-center text-sm text-gray-500">
										No hay comentarios
									</p>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Acciones */}
				<div className="col-span-1 mt-4 flex justify-end gap-3 border-t border-gray-700 pt-6 md:col-span-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-md border border-gray-600 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						className="rounded-md bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-50"
					>
						{isSubmitting ? (
							<div className="flex items-center gap-2">
								<Loader2 className="h-4 w-4" />
								<span>Procesando...</span>
							</div>
						) : ticket ? (
							'Actualizar Ticket'
						) : (
							'Crear Ticket'
						)}
					</button>
				</div>
			</form>
		</Modal>
	);
}
