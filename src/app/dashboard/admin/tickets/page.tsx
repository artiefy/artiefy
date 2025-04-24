'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Pencil, Trash2, Info } from 'lucide-react';
import TicketModal from './TicketModal';

export default function TicketsPage() {
	const [tickets, setTickets] = useState([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedTicket, setSelectedTicket] = useState<{
		id: string;
		[key: string]: any;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState('created'); // 'created', 'assigned', 'logs'
	const [filterType, setFilterType] = useState('all');
	const [filterStatus, setFilterStatus] = useState('all');
	const [viewTicket, setViewTicket] = useState<{
		id: string;
		email: string;
		description?: string;
		tipo?: string;
		estado?: string;
		assignedToName?: string;
		comments?: string;
	} | null>(null);

	const fetchTickets = async () => {
		try {
			setLoading(true);
			const response = await fetch(`/api/admin/tickets?type=${activeTab}`);
			const data = await response.json();

			// Mapear snake_case → camelCase
			const mapped = data.map((ticket: any) => ({
				...ticket,
				creatorName: ticket.creator_name,
				creatorEmail: ticket.creator_email,
				assignedToName: ticket.assigned_to_name,
				assignedToEmail: ticket.assigned_to_email,
			}));

			setTickets(mapped);
		} catch (error) {
			console.error('Error fetching tickets:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchTickets();
	}, [activeTab]);

	const filteredTickets = Array.isArray(tickets)
		? tickets.filter((ticket: any) => {
				return (
					(filterType === 'all' || ticket.tipo === filterType) &&
					(filterStatus === 'all' || ticket.estado === filterStatus)
				);
			})
		: [];

	const handleCreate = async (data: any) => {
		try {
			await fetch('/api/admin/tickets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			void fetchTickets();
		} catch (error) {
			console.error('Error creating ticket:', error);
		}
	};

	const handleUpdate = async (data: any) => {
		try {
			if (!selectedTicket) return;
			await fetch(`/api/admin/tickets/${selectedTicket.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			void fetchTickets();
		} catch (error) {
			console.error('Error updating ticket:', error);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm('¿Estás seguro de que quieres eliminar este ticket?')) return;

		try {
			await fetch(`/api/admin/tickets/${id}`, {
				method: 'DELETE',
			});
			void fetchTickets();
		} catch (error) {
			console.error('Error deleting ticket:', error);
		}
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedTicket(null); // Reset selected ticket when closing modal
	};

	const handleOpenCreateModal = () => {
		setSelectedTicket(null);
		setIsModalOpen(true);
	};

	return (
		<div className="p-4 sm:p-6">
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
				</div>
			</div>

			{/* Action buttons */}
			<div className="my-6 flex flex-wrap items-center justify-between gap-4">
				<button
					onClick={handleOpenCreateModal}
					className="group/button bg-background text-primary hover:bg-primary/10 relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-md border border-white/20 px-2 py-1.5 text-xs transition-all sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
				>
					<span className="relative z-10 font-medium">Crear Nuevo Ticket</span>
					<Plus className="relative z-10 size-3.5 sm:size-4" />
					<div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
				</button>

				<div className="flex flex-wrap gap-4">
					<div className="min-w-[150px]">
						<select
							value={filterType}
							onChange={(e) => setFilterType(e.target.value)}
							className="w-full rounded-lg border-2 border-gray-700 bg-gray-800 p-2 text-sm text-white"
						>
							<option value="all">Todos los tipos</option>
							<option value="otro">Otro</option>
							<option value="bug">Bug</option>
							<option value="revision">Revisión</option>
							<option value="logs">Logs</option>
						</select>
					</div>

					<div className="min-w-[150px]">
						<select
							value={filterStatus}
							onChange={(e) => setFilterStatus(e.target.value)}
							className="w-full rounded-lg border-2 border-gray-700 bg-gray-800 p-2 text-sm text-white"
						>
							<option value="all">Todos los estados</option>
							<option value="abierto">Abierto</option>
							<option value="en proceso">En Proceso</option>
							<option value="en revision">En Revisión</option>
							<option value="solucionado">Solucionado</option>
							<option value="cerrado">Cerrado</option>
						</select>
					</div>
				</div>
			</div>

			{/* Tickets table */}
			<div className="mt-6 overflow-hidden rounded-lg bg-gray-800/50 shadow-xl backdrop-blur-sm">
				<div className="overflow-x-auto">
					<table className="min-w-full table-auto border-collapse">
						<thead>
							<tr className="border-b border-gray-700 bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] text-white">
								<th className="px-4 py-3 text-left text-xs font-medium sm:text-sm">
									ID
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium sm:text-sm">
									Usuario
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium sm:text-sm">
									Tipo
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium sm:text-sm">
									Estado
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium sm:text-sm">
									Asignado a
								</th>
								<th className="px-4 py-3 text-right text-xs font-medium sm:text-sm">
									Acciones
								</th>
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
								filteredTickets.map((ticket: any) => (
									<tr
										key={ticket.id}
										className="group transition-colors hover:bg-gray-700/50"
									>
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
											{ticket.assignedToName || 'Sin asignar'}
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
													onClick={() => handleDelete(ticket.id)}
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
				</div>
			</div>

			{viewTicket && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-8">
					<div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 p-10 shadow-2xl">
						{/* Botón de cierre */}
						<button
							onClick={() => setViewTicket(null)}
							className="absolute top-4 right-4 text-xl text-gray-400 hover:text-white"
						>
							✕
						</button>

						{/* Título */}
						<h2 className="mb-8 text-3xl font-extrabold tracking-tight text-white">
							Detalles del Ticket #{viewTicket.id}
						</h2>

						{/* Grid de contenido */}
						<div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
							{/* Columna izquierda */}
							<div className="space-y-6 text-lg leading-relaxed text-white">
								<div>
									<h3 className="text-sm font-semibold text-gray-400 uppercase">
										Usuario
									</h3>
									<p>{viewTicket.email}</p>
								</div>

								<div>
									<h3 className="text-sm font-semibold text-gray-400 uppercase">
										Descripción
									</h3>
									<p className="whitespace-pre-wrap">
										{viewTicket.description}
									</p>
								</div>

								<div>
									<h3 className="text-sm font-semibold text-gray-400 uppercase">
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

							{/* Columna derecha */}
							<div className="space-y-6 text-lg leading-relaxed text-white">
								<div>
									<h3 className="text-sm font-semibold text-gray-400 uppercase">
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

								<div>
									<h3 className="text-sm font-semibold text-gray-400 uppercase">
										Asignado a
									</h3>
									<p>{viewTicket.assignedToName || 'Sin asignar'}</p>
								</div>

								<div>
									<h3 className="text-sm font-semibold text-gray-400 uppercase">
										Comentarios
									</h3>
									<p className="whitespace-pre-wrap">
										{viewTicket.comments || '—'}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			<TicketModal
				key={selectedTicket ? selectedTicket.id : 'new'}
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				onSubmit={selectedTicket ? handleUpdate : handleCreate}
				ticket={selectedTicket}
			/>
		</div>
	);
}
