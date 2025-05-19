'use client';

import { useState, useEffect, useCallback } from 'react';

import Image from 'next/image';

import { Info, Loader2, Pencil, Plus, Trash2, FileText } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import { z } from 'zod';
import 'react-toastify/dist/ReactToastify.css';

import ChatList from '~/app/dashboard/admin/chat/ChatList';

import TicketModal from './TicketModal';

// Schema definitions
const uploadSchema = z.object({
	url: z.string().url(),
	fields: z.record(z.string()),
	key: z.string(),
	uploadType: z.union([z.literal('simple'), z.literal('put')]),
});

const rawTicketSchema = z.array(
	z.object({
		id: z.union([z.string(), z.number()]), // acepta string o number
		email: z.string(),
		description: z.string(),
		tipo: z.string(),
		estado: z.string(),
		assigned_to_name: z.string().optional(),
		assigned_to_email: z.string().optional(),
		assigned_to_id: z.string().optional(),
		creator_name: z.string().optional(),
		creator_email: z.string().optional(),
		comments: z.string().optional(),
		created_at: z.string(),
		updated_at: z.string(),
		time_elapsed_ms: z.number(),
		cover_image_key: z.string().optional(),
		video_key: z.union([z.string(), z.null()]).optional(),
		document_key: z.union([z.string(), z.null()]).optional(),
	})
);

// Types

export interface TicketFormData {
	email: string;
	description: string;
	tipo: string;
	estado: string;
	assignedToId?: string;
	comments?: string;
	coverImageKey?: string;
	videoKey?: string; // ✅ AÑADIR
	documentKey?: string; // ✅ AÑADIR
	newComment?: string;
}

export interface Comment {
	id: number;
	content: string;
	createdAt: string;
	user: {
		name: string;
	};
}

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
	createdAt: Date;
	updatedAt: Date;
	timeElapsedMs: number;
	coverImageKey?: string;
	videoKey?: string;
	documentKey?: string;
}

// Component
export default function TicketsPage() {
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
	const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [activeTab, setActiveTab] = useState<
		'created' | 'assigned' | 'logs' | 'chats'
	>('created');
	const [filterType, setFilterType] = useState<string>('all');
	const [filterStatus, setFilterStatus] = useState<string>('all');
	const [unreadConversationIds] = useState<string[]>([]);
	const [viewTicket, setViewTicket] = useState<Ticket | null>(null);
	const [selectedChat, setSelectedChat] = useState<{
		id: string;
		userName: string;
		receiverId: string;
	} | null>(null);
	void selectedChat?.id;
	const [filterId, setFilterId] = useState('');
	const [filterEmail, setFilterEmail] = useState('');
	const [filterAssignedTo, setFilterAssignedTo] = useState('');
	const [filterStartDate, setFilterStartDate] = useState<string>('');
	const [filterEndDate, setFilterEndDate] = useState<string>('');
	const [comments, setComments] = useState<Comment[]>([]);
	const [isLoadingComments, setIsLoadingComments] = useState(false);

	useEffect(() => {
		if (viewTicket?.id) {
			const fetchComments = async () => {
				try {
					setIsLoadingComments(true);
					const response = await fetch(
						`/api/admin/tickets/${viewTicket.id}/comments`
					);
					if (!response.ok)
						throw new Error('No se pudo obtener los comentarios');
					const data = (await response.json()) as Comment[];
					setComments(data);
				} catch (error) {
					console.error('Error cargando comentarios:', error);
				} finally {
					setIsLoadingComments(false);
				}
			};

			void fetchComments();
		}
	}, [viewTicket?.id]);

	useEffect(() => {
		fetch('/api/socketio', {
			method: 'POST',
		}).catch((err) => console.warn('Socket init error:', err));
	}, []);

	function formatElapsedTime(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const days = Math.floor(totalSeconds / 86400);
		const hours = Math.floor((totalSeconds % 86400) / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		let result = '';
		if (days > 0) result += `${days}d `;
		if (hours > 0 || days > 0) result += `${hours}h `;
		if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}m `;
		result += `${seconds}s`;

		return result.trim();
	}

	const fetchTickets = useCallback(async (): Promise<void> => {
		try {
			setLoading(true);
			const response = await fetch(`/api/admin/tickets?type=${activeTab}`);
			if (!response.ok)
				throw new Error(`HTTP error! status: ${response.status}`);
			const json = (await response.json()) as unknown;
			const rawData = rawTicketSchema.parse(json);

			const mapped: Ticket[] = rawData.map((ticket) => ({
				id: String(ticket.id),
				email: ticket.email,
				description: ticket.description,
				tipo: ticket.tipo,
				estado: ticket.estado,
				assignedToName: ticket.assigned_to_name ?? '',
				assignedToEmail: ticket.assigned_to_email ?? '',
				assignedToId: ticket.assigned_to_id ?? '',
				creatorName: ticket.creator_name ?? '',
				creatorEmail: ticket.creator_email ?? '',
				comments: ticket.comments ?? '',
				createdAt: new Date(ticket.created_at),
				updatedAt: new Date(ticket.updated_at),
				timeElapsedMs: ticket.time_elapsed_ms,
				coverImageKey: ticket.cover_image_key ?? '',
				videoKey: ticket.video_key ?? '',
				documentKey: ticket.document_key ?? '',
			}));

			setTickets(mapped);
		} catch (error) {
			console.error(
				'Error fetching tickets:',
				error instanceof Error ? error.message : error
			);
		} finally {
			setLoading(false);
		}
	}, [activeTab]);

	useEffect(() => {
		void fetchTickets();
	}, [fetchTickets]);

	const filteredTickets = tickets.filter((ticket) => {
		const createdDateOnly = ticket.createdAt.toISOString().split('T')[0];

		return (
			(filterType === 'all' || ticket.tipo === filterType) &&
			(filterStatus === 'all' || ticket.estado === filterStatus) &&
			String(ticket.id).toLowerCase().includes(filterId.toLowerCase()) &&
			(filterEmail === '' || ticket.email === filterEmail) &&
			(filterAssignedTo === '' || ticket.assignedToName === filterAssignedTo) &&
			(filterStartDate === '' || createdDateOnly >= filterStartDate) &&
			(filterEndDate === '' || createdDateOnly <= filterEndDate)
		);
	});

	const uniqueUsers = Array.from(new Set(tickets.map((t) => t.email))).filter(
		Boolean
	);

	const uniqueAssignedTo = Array.from(
		new Set(tickets.map((t) => t.assignedToName).filter(Boolean))
	);

	const handleCreate = async (data: TicketFormData): Promise<void> => {
		try {
			console.log('🧾 Enviando ticket:', data);

			// 1. Enviar el ticket base
			const res = await fetch('/api/admin/tickets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			const created = (await res.json()) as { id: string };

			// 2. Si el video ya fue subido y hay un key, hacer PUT al endpoint
			if (data.videoKey) {
				const payload = JSON.stringify({ videoKey: data.videoKey });
				const blob = new Blob([payload], { type: 'application/json' });
				const sent = navigator.sendBeacon(
					`/api/tickets/${(created as { id: string }).id}/video`,
					blob
				);

				if (!sent) {
					await fetch(`/api/tickets/${(created as { id: string }).id}/video`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: payload,
					});
				}
			}

			toast.success('✅ Ticket creado exitosamente');

			void fetchTickets();
		} catch (error) {
			toast.error('❌ Error al crear el ticket');

			console.error(
				'Error creating ticket:',
				error instanceof Error ? error.message : error
			);
		}
	};

	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	const paginatedTickets = (() => {
		const start = (currentPage - 1) * itemsPerPage;
		const end =
			itemsPerPage === -1 ? filteredTickets.length : start + itemsPerPage;
		return filteredTickets.slice(start, end);
	})();

	const handleUpdate = async (data: TicketFormData): Promise<void> => {
		try {
			if (!selectedTicket) return;
			console.log('🧾 Enviando ticket:', data);

			await fetch(`/api/admin/tickets/${selectedTicket.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			toast.success('✅ Ticket creado exitosamente');

			void fetchTickets();
		} catch (error) {
			toast.error('❌ Error al crear el ticket');

			console.error(
				'Error updating ticket:',
				error instanceof Error ? error.message : error
			);
		}
	};

	const handleFileUpload = async (
		field: 'videoKey' | 'documentKey' | 'coverImageKey',
		file: File,
		ticketId?: number
	): Promise<string | null> => {
		console.log('📤 Upload start:', file.name, 'field:', field);

		try {
			const res = await fetch('/api/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					fileName: file.name,
					contentType: file.type,
					fileSize: file.size,
				}),
			});

			if (!res.ok) {
				const errorText = await res.text();
				console.error('❌ Upload failed with status', res.status, errorText);
				return null;
			}

			const json: unknown = await res.json();
			const { url, fields, key, uploadType } = uploadSchema.parse(json);

			if (uploadType === 'simple') {
				const formDataUpload = new FormData();
				Object.entries(fields).forEach(([k, v]) => formDataUpload.append(k, v));
				formDataUpload.append('file', file);
				await fetch(url, { method: 'POST', body: formDataUpload });
			} else {
				await fetch(url, {
					method: 'PUT',
					headers: { 'Content-Type': file.type },
					body: file,
				});
			}

			// ✅ Enviar videoKey al backend en segundo plano (si aplica)
			if (field === 'videoKey' && ticketId) {
				const payload = JSON.stringify({ videoKey: key });
				const blob = new Blob([payload], { type: 'application/json' });
				const sent = navigator.sendBeacon(
					`/api/tickets/${ticketId}/video`,
					blob
				);

				if (!sent) {
					await fetch(`/api/tickets/${ticketId}/video`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: payload,
					});
				}

				console.log('🎥 El video se está subiendo en segundo plano.');
				toast.info('🎥 El video se está subiendo en segundo plano.');
			}

			return key;
		} catch (err) {
			console.error('❌ Error subiendo archivo:', err);
			return null;
		}
	};
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const toggleSelectId = (id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
		);
	};

	const handleDelete = async (id: string): Promise<void> => {
		if (!confirm('¿Estás seguro de que quieres eliminar este ticket?')) return;
		try {
			await fetch(`/api/admin/tickets/${id}`, { method: 'DELETE' });
			void fetchTickets();
		} catch (error) {
			console.error(
				'Error deleting ticket:',
				error instanceof Error ? error.message : error
			);
		}
	};

	const handleCloseModal = (): void => {
		setIsModalOpen(false);
		setSelectedTicket(null);
	};

	const handleOpenCreateModal = (): void => {
		setSelectedTicket(null);
		setIsModalOpen(true);
	};

	const handleSelectChat = (chatId: string, receiverId: string): void => {
		setSelectedChat({ id: chatId, receiverId, userName: 'Usuario' });
	};

	return (
		<>
			<div className="relative min-h-screen overflow-visible p-4 sm:p-6">
				{/* Header with gradient effect */}
				<header className="group relative overflow-hidden rounded-lg p-[1px]">
					<div className="animate-gradient absolute -inset-0.5 bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-75 blur transition duration-500" />
					<div className="relative flex flex-col items-start justify-between rounded-lg bg-gray-800 p-4 text-white shadow-lg transition-all duration-300 group-hover:bg-gray-800/95 sm:flex-row sm:items-center sm:p-6">
						<h1 className="text-primary flex items-center gap-3 text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl">
							Tickets de Soporte
						</h1>
					</div>
				</header>

				{/* Tabs */}
				<div className="mt-6 border-b border-gray-700">
					<div className="flex space-x-8">
						<button
							onClick={() => setActiveTab('created')}
							className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
								activeTab === 'created'
									? 'border-blue-500 text-blue-500'
									: 'border-transparent text-gray-400 hover:border-gray-400 hover:text-gray-300'
							}`}
						>
							Tickets Creados
						</button>
						<button
							onClick={() => setActiveTab('assigned')}
							className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
								activeTab === 'assigned'
									? 'border-blue-500 text-blue-500'
									: 'border-transparent text-gray-400 hover:border-gray-400 hover:text-gray-300'
							}`}
						>
							Tickets Asignados
						</button>
						<button
							onClick={() => setActiveTab('logs')}
							className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
								activeTab === 'logs'
									? 'border-blue-500 text-blue-500'
									: 'border-transparent text-gray-400 hover:border-gray-400 hover:text-gray-300'
							}`}
						>
							Logs
						</button>
						<button
							onClick={() => setActiveTab('chats')}
							className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
								activeTab === 'chats'
									? 'border-blue-500 text-blue-500'
									: 'border-transparent text-gray-400 hover:border-gray-400 hover:text-gray-300'
							}`}
						>
							Chats
						</button>
					</div>
				</div>

				{/* Action buttons */}

				<div className="my-6 flex flex-wrap items-center justify-between gap-4">
					{/* Botones a la izquierda */}
					<div className="flex flex-wrap items-center gap-4">
						<button
							onClick={handleOpenCreateModal}
							className="group/button bg-background text-primary hover:bg-primary/10 relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-md border border-white/20 px-2 py-1.5 text-xs transition-all sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
						>
							<span className="relative z-10 font-medium">
								Crear Nuevo Ticket
							</span>
							<Plus className="relative z-10 size-3.5 sm:size-4" />
							<div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
						</button>

						<button
							onClick={async () => {
								if (
									!confirm(
										`¿Seguro que deseas eliminar ${selectedIds.length} ticket(s)?`
									)
								)
									return;
								try {
									console.log(
										'🧾 Enviando al backend para bulkDelete:',
										selectedIds
									);

									await fetch('/api/admin/tickets/bulkDelete', {
										method: 'DELETE',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify({
											ids: selectedIds.map((id) => Number(id)), // 👈 convierte a número aquí
										}),
									});
									

									setSelectedIds([]);
									toast.success('✅ Tickets eliminados');
									void fetchTickets();
								} catch (err) {
									console.error(err);
									toast.error('❌ Error al eliminar tickets');
								}
							}}
							disabled={selectedIds.length === 0}
							className={`rounded-md border px-4 py-2 text-sm transition ${
								selectedIds.length === 0
									? 'cursor-not-allowed bg-gray-700 text-gray-400'
									: 'bg-red-600 text-white hover:bg-red-700'
							}`}
						>
							Eliminar Seleccionados
						</button>
					</div>

					{/* Filtros y contador a la derecha */}
					<div className="flex flex-wrap items-center gap-4">
						<div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-4 shadow-md backdrop-blur-lg sm:flex-row sm:items-center">
							<div className="flex flex-col">
								<label className="mb-1 text-sm font-medium text-blue-300">
									Desde
								</label>
								<input
									type="date"
									value={filterStartDate}
									onChange={(e) => setFilterStartDate(e.target.value)}
									className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 shadow-inner transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
								/>
							</div>
							<div className="flex flex-col">
								<label className="mb-1 text-sm font-medium text-blue-300">
									Hasta
								</label>
								<input
									type="date"
									value={filterEndDate}
									onChange={(e) => setFilterEndDate(e.target.value)}
									className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 shadow-inner transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
								/>
							</div>
						</div>

						<div className="inline-flex items-center gap-3 rounded-lg border border-blue-400/30 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 px-6 py-4 text-lg font-semibold text-blue-100 shadow-lg backdrop-blur-sm">
							<FileText className="h-6 w-6 animate-pulse text-blue-300 drop-shadow-md" />
							<span className="tracking-wide">
								{filteredTickets.length} ticket(s) encontrado(s)
							</span>
						</div>
					</div>
				</div>

				{/* Tickets table */}
				{activeTab === 'chats' ? (
					<div className="mt-6">
						<ChatList
							onSelectChat={(id, receiverId) =>
								handleSelectChat(id, receiverId)
							}
							unreadConversationIds={unreadConversationIds}
						/>
					</div>
				) : (
					<div className="mt-6 overflow-hidden rounded-lg bg-gray-800/50 shadow-xl backdrop-blur-sm">
						<div className="overflow-x-auto">
							<table className="min-w-full table-auto border-collapse">
								<thead>
									{/* Filtros */}
									<tr className="border-b border-gray-700 bg-gray-900 text-xs text-white sm:text-sm">
										<th>
											{' '}
											<div className="mt-1 flex items-center gap-2 text-sm text-white">
												<span>Mostrar:</span>
												<select
													value={itemsPerPage}
													onChange={(e) => {
														const value = Number(e.target.value);
														setItemsPerPage(value);
														setCurrentPage(1); // reiniciar a primera página
													}}
													className="rounded-md border border-gray-600 bg-gray-800 px-2 py-1 text-white"
												>
													<option value={10}>10</option>
													<option value={50}>50</option>
													<option value={100}>100</option>
													<option value={-1}>Todos</option>
												</select>
											</div>{' '}
										</th>
										<th className="px-4 py-2">
											<input
												type="text"
												placeholder="Buscar ID"
												value={filterId}
												onChange={(e) => setFilterId(e.target.value)}
												className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
											/>
										</th>
										<th className="px-4 py-2">
											<select
												value={filterEmail}
												onChange={(e) => setFilterEmail(e.target.value)}
												className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
											>
												<option value="">Todos</option>
												{uniqueUsers.map((user) => (
													<option key={user} value={user}>
														{user}
													</option>
												))}
											</select>
										</th>
										<th className="px-4 py-2">
											<select
												value={filterType}
												onChange={(e) => setFilterType(e.target.value)}
												className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
											>
												<option value="all">Todos</option>
												<option value="bug">Bug</option>
												<option value="revision">Revisión</option>
												<option value="logs">Logs</option>
												<option value="otro">Otro</option>
											</select>
										</th>
										<th className="px-4 py-2">
											<select
												value={filterStatus}
												onChange={(e) => setFilterStatus(e.target.value)}
												className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
											>
												<option value="all">Todos</option>
												<option value="abierto">Abierto</option>
												<option value="en proceso">En Proceso</option>
												<option value="en revision">En Revisión</option>
												<option value="solucionado">Solucionado</option>
												<option value="cerrado">Cerrado</option>
											</select>
										</th>
										<th className="px-4 py-2">
											<select
												value={filterAssignedTo}
												onChange={(e) => setFilterAssignedTo(e.target.value)}
												className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
											>
												<option value="">Todos</option>
												{uniqueAssignedTo.map((name) => (
													<option key={name} value={name}>
														{name}
													</option>
												))}
											</select>
										</th>
										<th />
										<th />
										<th />
									</tr>

									{/* Títulos */}
									<tr className="border-b border-gray-700 bg-gray-800 text-xs text-gray-300 sm:text-sm">
										<th className="px-4 py-2 text-left" />
										<th className="px-4 py-2 text-left">ID</th>
										<th className="px-4 py-2 text-left">Email</th>
										<th className="px-4 py-2 text-left">Tipo</th>
										<th className="px-4 py-2 text-left">Estado</th>
										<th className="px-4 py-2 text-left">Asignado a</th>
										<th className="px-4 py-2 text-left">Fecha de Creación</th>
										<th className="px-4 py-2 text-left">Tiempo Transcurrido</th>

										<th className="px-4 py-2 text-left">Acciones</th>
									</tr>
								</thead>

								<tbody className="divide-y divide-gray-700/50">
									{loading ? (
										<tr>
											<td colSpan={6} className="px-4 py-8 text-center">
												<Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
											</td>
										</tr>
									) : filteredTickets.length === 0 ? (
										<tr>
											<td
												colSpan={6}
												className="px-4 py-8 text-center text-gray-400"
											>
												No hay tickets disponibles
											</td>
										</tr>
									) : (
										paginatedTickets.map((ticket) => (
											<tr
												key={ticket.id}
												className="group transition-colors hover:bg-gray-700/50"
											>
												<td className="px-4 py-4">
													<input
														type="checkbox"
														checked={selectedIds.includes(ticket.id)}
														onChange={() => toggleSelectId(ticket.id)}
														className="mr-2"
													/>
												</td>
												<td className="px-4 py-4">#{ticket.id}</td>
												<td className="px-4 py-4">{ticket.email}</td>
												<td className="px-4 py-4">
													<span
														className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
															ticket.tipo === 'bug'
																? 'bg-red-500/10 text-red-500'
																: ticket.tipo === 'revision'
																	? 'bg-yellow-500/10 text-yellow-500'
																	: ticket.tipo === 'logs'
																		? 'bg-purple-500/10 text-purple-500'
																		: 'bg-gray-500/10 text-gray-500'
														}`}
													>
														{ticket.tipo}
													</span>
												</td>
												<td className="px-4 py-4">
													<span
														className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
															ticket.estado === 'abierto'
																? 'bg-green-500/10 text-green-500'
																: ticket.estado === 'en proceso'
																	? 'bg-blue-500/10 text-blue-500'
																	: ticket.estado === 'en revision'
																		? 'bg-yellow-500/10 text-yellow-500'
																		: ticket.estado === 'solucionado'
																			? 'bg-purple-500/10 text-purple-500'
																			: 'bg-gray-500/10 text-gray-500'
														}`}
													>
														{ticket.estado}
													</span>
												</td>
												<td className="px-4 py-4">
													{ticket.assignedToName ?? 'Sin asignar'}
												</td>
												<td className="px-4 py-4">
													{ticket.createdAt.toLocaleString()}
												</td>
												<td className="px-4 py-4">
													{formatElapsedTime(ticket.timeElapsedMs)}
												</td>

												<td className="px-4 py-4">
													<div className="flex items-center justify-end gap-1 sm:gap-2">
														<button
															onClick={() => setViewTicket(ticket)}
															className="rounded-md p-1 hover:bg-blue-500/10 hover:text-blue-500"
															title="Ver detalles"
														>
															<Info className="size-3.5 sm:size-4" />
														</button>
														<button
															onClick={() => {
																setSelectedTicket(ticket);
																setIsModalOpen(true);
															}}
															className="rounded-md p-1 hover:bg-gray-700"
															title="Editar"
														>
															<Pencil className="size-3.5 sm:size-4" />
														</button>
														<button
															onClick={() => void handleDelete(ticket.id)}
															className="rounded-md p-1 hover:bg-red-500/10 hover:text-red-500"
															title="Eliminar"
														>
															<Trash2 className="size-3.5 sm:size-4" />
														</button>
													</div>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
							{itemsPerPage !== -1 && (
								<div className="mt-4 flex items-center justify-center gap-2 text-sm text-white">
									<button
										onClick={() =>
											setCurrentPage((prev) => Math.max(prev - 1, 1))
										}
										disabled={currentPage === 1}
										className="rounded-md border border-gray-600 bg-gray-800 px-3 py-1 disabled:opacity-50"
									>
										Anterior
									</button>

									<span className="px-2">
										Página {currentPage} de{' '}
										{Math.ceil(filteredTickets.length / itemsPerPage)}
									</span>

									<button
										onClick={() =>
											setCurrentPage((prev) =>
												prev < Math.ceil(filteredTickets.length / itemsPerPage)
													? prev + 1
													: prev
											)
										}
										disabled={
											currentPage >=
											Math.ceil(filteredTickets.length / itemsPerPage)
										}
										className="rounded-md border border-gray-600 bg-gray-800 px-3 py-1 disabled:opacity-50"
									>
										Siguiente
									</button>
								</div>
							)}
						</div>
					</div>
				)}

				{viewTicket && (
					<div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/60 p-4">
						<div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 p-4 shadow-2xl md:p-6 lg:p-10">
							<button
								onClick={() => setViewTicket(null)}
								className="absolute top-4 right-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
								aria-label="Close modal"
							>
								✕
							</button>

							<h2 className="mb-6 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
								Detalles del Ticket #{viewTicket.id}
							</h2>

							<div className="grid gap-8 lg:grid-cols-2">
								<div className="space-y-6">
									<div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
										<h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase">
											Usuario
										</h3>
										<p className="text-lg text-white">{viewTicket.email}</p>
									</div>

									<div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
										<h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase">
											Descripción
										</h3>
										<p className="text-lg whitespace-pre-wrap text-white">
											{viewTicket.description}
										</p>
									</div>

									<div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
										<h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase">
											Tipo
										</h3>
										<span
											className={`inline-block rounded-full px-3 py-1 text-sm font-medium capitalize ${
												viewTicket.tipo === 'bug'
													? 'bg-red-500/10 text-red-400'
													: viewTicket.tipo === 'revision'
														? 'bg-yellow-500/10 text-yellow-400'
														: viewTicket.tipo === 'logs'
															? 'bg-purple-500/10 text-purple-400'
															: 'bg-gray-500/10 text-gray-400'
											}`}
										>
											{viewTicket.tipo}
										</span>
									</div>
								</div>

								<div className="space-y-6">
									<div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
										<h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase">
											Estado
										</h3>
										<span
											className={`inline-block rounded-full px-3 py-1 text-sm font-medium capitalize ${
												viewTicket.estado === 'abierto'
													? 'bg-green-500/10 text-green-400'
													: viewTicket.estado === 'en proceso'
														? 'bg-blue-500/10 text-blue-400'
														: viewTicket.estado === 'en revision'
															? 'bg-yellow-500/10 text-yellow-400'
															: viewTicket.estado === 'solucionado'
																? 'bg-purple-500/10 text-purple-400'
																: 'bg-gray-500/10 text-gray-400'
											}`}
										>
											{viewTicket.estado}
										</span>
									</div>

									<div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
										<h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase">
											Asignado a
										</h3>
										<p className="text-lg text-white">
											{viewTicket.assignedToName ?? 'Sin asignar'}
										</p>
									</div>

									<div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
										<h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase">
											Comentario Principal
										</h3>
										<p className="text-lg whitespace-pre-wrap text-white">
											{viewTicket.comments ?? '—'}
										</p>
									</div>
								</div>

								{/* Archivos Adjuntos */}
								<div className="lg:col-span-2">
									<div className="space-y-4 rounded-lg border border-gray-800 bg-gray-800/50 p-4">
										<h3 className="text-lg font-medium text-white">
											Archivos Adjuntos
										</h3>
										<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
											{/* Imagen */}
											{viewTicket.coverImageKey && (
												<div className="space-y-2">
													<p className="text-sm font-medium text-gray-300">
														📷 Imagen
													</p>
													<div className="relative h-32 overflow-hidden rounded-lg border border-gray-600">
														<Image
															src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${viewTicket.coverImageKey}`}
															alt="Imagen de soporte"
															fill
															className="object-contain"
														/>
													</div>
												</div>
											)}

											{/* Video */}
											{viewTicket.videoKey && (
												<div className="space-y-2">
													<p className="text-sm font-medium text-gray-300">
														🎥 Video
													</p>
													<div className="relative h-32 overflow-hidden rounded-lg border border-gray-600">
														<video
															controls
															className="h-full w-full object-contain"
														>
															<source
																src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${viewTicket.videoKey}`}
																type="video/mp4"
															/>
														</video>
													</div>
												</div>
											)}

											{/* Documento */}
											{viewTicket.documentKey && (
												<div className="space-y-2">
													<p className="text-sm font-medium text-gray-300">
														📄 Documento
													</p>
													<a
														href={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${viewTicket.documentKey}`}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-block rounded-lg bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-400 hover:bg-blue-500/20"
													>
														📄 Ver Documento
													</a>
												</div>
											)}
										</div>
									</div>
								</div>

								{/* Comentarios */}
								<div className="lg:col-span-2">
									<div className="space-y-4 rounded-lg border border-gray-800 bg-gray-800/50 p-4">
										<h3 className="text-lg font-medium text-white">
											Historial de Comentarios
										</h3>
										<div className="max-h-[40vh] space-y-3 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900/50 p-4">
											{isLoadingComments ? (
												<div className="flex items-center justify-center py-4">
													<Loader2 className="h-6 w-6 animate-spin text-blue-500" />
												</div>
											) : comments.length > 0 ? (
												comments.map((comment, index) => (
													<div
														key={index}
														className="rounded-lg border border-gray-700 bg-gray-800/80 p-4 backdrop-blur-sm"
													>
														<div className="flex flex-wrap items-center justify-between gap-2">
															<span className="font-medium text-blue-400">
																{comment.user?.name || 'Usuario'}
															</span>
															<span className="text-sm text-gray-500">
																{new Date(comment.createdAt).toLocaleString()}
															</span>
														</div>
														<p className="mt-2 text-gray-300">
															{comment.content}
														</p>
													</div>
												))
											) : (
												<p className="text-center text-gray-500">
													No hay comentarios
												</p>
											)}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				<TicketModal
					key={selectedTicket ? selectedTicket.id : 'new'}
					isOpen={isModalOpen}
					onCloseAction={handleCloseModal}
					onSubmitAction={selectedTicket ? handleUpdate : handleCreate}
					ticket={selectedTicket}
					onUploadFileAction={handleFileUpload} // ✅ ESTA ES LA CLAVE QUE FALTABA
				/>
			</div>
			<ToastContainer position="top-right" autoClose={3000} />
		</>
	);
}
