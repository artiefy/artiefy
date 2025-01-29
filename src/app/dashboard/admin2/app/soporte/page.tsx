'use client';

import { useState } from 'react';
import {
	TicketIcon,
	CheckCircleIcon,
	ClockIcon,
	MessageCircle,
} from 'lucide-react';
import { Button } from '~/components/admin/ui/button';
import { ConfirmationDialog } from '~/components/admin/ui/confirmationDialog';
import { DashboardMetrics } from '~/components/admin/ui/DashboardMetrics';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '~/components/admin/ui/dialog';
import { Input } from '~/components/admin/ui/input';
import { LiveChat } from '~/components/admin/ui/LiveChat';
import { NewTicketForm } from '~/components/admin/ui/NewTicketForm';
import { TicketDetail } from '~/components/admin/ui/TicketDetail';
import { TicketList } from '~/components/admin/ui/TicketList';

interface TicketDetailProps {
	id: number;
	estudiante: string;
	asunto: string;
	descripcion: string;
	estado: 'Abierto' | 'En Progreso' | 'Resuelto';
	fechaCreacion?: Date | null;
	imagen?: string;
	onUpdateTicket: (updatedTicket: LocalTicket, newImage?: File) => void;
	onDeleteTicket: () => void;
}

export interface LocalTicket
	extends Omit<TicketDetailProps, 'onUpdateTicket'> {}

interface Ticket {
	id: number;
	title: string;
	description: string;
	status: 'Abierto' | 'En Progreso' | 'Resuelto';
	prioridad: string; // Cambiado de 'priority' a 'prioridad'
	createdAt: string;
	image?: string;
	updatedAt?: string;
	studentName: string;
	studentEmail: string;
	estudiante: string;
	asunto: string;
	descripcion: string;
	estado: 'Abierto' | 'En Progreso' | 'Resuelto';
	fechaCreacion?: Date | null;
	imagen?: string | File;
}

export default function Soporte() {
	const [tickets, setTickets] = useState<LocalTicket[]>([
		{
			id: 1,
			estudiante: 'Ana García',
			asunto: 'Problema con el acceso al curso',
			descripcion: 'No puedo acceder al material del curso de Programación Avanzada',
			estado: 'Abierto',
			fechaCreacion: new Date('2023-06-15'),
			onDeleteTicket: function (): void {
				throw new Error('Function not implemented.');
			}
		},
		{
			id: 2,
			estudiante: 'Carlos Rodríguez',
			asunto: 'Error en la subida de tareas',
			descripcion: 'Al intentar subir mi tarea, recibo un error de "archivo no soportado"',
			estado: 'En Progreso',
			fechaCreacion: new Date('2023-06-14'),
			onDeleteTicket: function (): void {
				throw new Error('Function not implemented.');
			}
		},
	]);

	const [selectedTicket, setSelectedTicket] = useState<LocalTicket | null>(
		null
	);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isChatOpen, setIsChatOpen] = useState(false);

	const handleAddTicket = (
		newTicket: Omit<LocalTicket, 'id' | 'fechaCreacion' | 'estado'> & {
			imagen?: string | File;
		}
	) => {
		const imagenUrl = typeof newTicket.imagen === 'object' && (newTicket.imagen as any) instanceof File
			? URL.createObjectURL(newTicket.imagen)
			: newTicket.imagen;

		const ticket: LocalTicket = {
			...newTicket,
			id: tickets.length + 1,
			fechaCreacion: new Date(),
			estado: 'Abierto',
			imagen: imagenUrl,
		};

		setTickets([...tickets, ticket]);
	};

	const handleUpdateTicket = (updatedTicket: LocalTicket, newImage?: File) => {
		const imagenUrl = newImage
			? URL.createObjectURL(newImage)
			: updatedTicket.imagen;

		const finalUpdatedTicket: LocalTicket = {
			...updatedTicket,
			imagen: imagenUrl,
		};

		setTickets(
			tickets.map((ticket) =>
				ticket.id === finalUpdatedTicket.id ? finalUpdatedTicket : ticket
			)
		);
		setSelectedTicket(null);
	};

	const handleDeleteTicket = (id: number) => {
		setTickets(tickets.filter((ticket) => ticket.id !== id));
		setSelectedTicket(null);
		setIsDeleteDialogOpen(false);
	};

	return (
		<div className="min-h-screen space-y-6 bg-background p-6 text-foreground">
			<h2 className="text-3xl font-bold tracking-tight text-foreground">
				Soporte a Estudiantes
			</h2>

			<DashboardMetrics
				metrics={[
					{
						title: 'Tickets Abiertos',
						value: tickets
							.filter((t) => t.estado === 'Abierto')
							.length.toString(),
						icon: TicketIcon,
						href: '/soporte',
					},
					{
						title: 'Tickets Resueltos',
						value: tickets
							.filter((t) => t.estado === 'Resuelto')
							.length.toString(),
						icon: CheckCircleIcon,
						href: '/soporte',
					},
					{
						title: 'Tiempo Promedio de Resolución',
						value: '2 días',
						icon: ClockIcon,
						href: '/soporte',
					},
				]}
			/>

			<div className="mb-6 flex items-center justify-between">
				<Input
					placeholder="Buscar tickets..."
					className="max-w-sm border-input bg-background text-foreground"
				/>
				<div className="space-x-2">
					<Dialog>
						<DialogTrigger asChild>
							<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
								Nuevo Ticket
							</Button>
						</DialogTrigger>
						<DialogContent className="bg-background text-foreground">
							<DialogHeader>
								<DialogTitle className="text-foreground">
									Crear Nuevo Ticket
								</DialogTitle>
							</DialogHeader>
							<NewTicketForm onSubmit={handleAddTicket} />
						</DialogContent>
					</Dialog>
					<Button
						onClick={() => setIsChatOpen(true)}
						className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
					>
						<MessageCircle className="mr-2 size-4" /> Chat en Vivo
					</Button>
				</div>
			</div>

			<div className="flex space-x-6">
				<div
					className={`grow transition-all duration-300 ${
						selectedTicket || isChatOpen ? 'w-2/3' : 'w-full'
					}`}
				>
					<TicketList
						tickets={tickets.map((ticket) => ({
							id: ticket.id,
							title: ticket.asunto, // Mapeo de 'asunto' a 'title'
							description: ticket.descripcion, // Mapeo de 'descripcion' a 'description'
							status: ticket.estado, // Mapeo de 'estado' a 'status'
							prioridad: 'Normal', // Cambiado de 'priority' a 'prioridad'
							createdAt: ticket.fechaCreacion?.toISOString() || '',
							image: typeof ticket.imagen === 'string' ? ticket.imagen : undefined,
							updatedAt: ticket.fechaCreacion?.toISOString() || '',
							studentName: ticket.estudiante,
							studentEmail: '', // Asignar un valor por defecto a 'studentEmail'
							estudiante: ticket.estudiante,
							asunto: ticket.asunto,
							descripcion: ticket.descripcion,
							estado: ticket.estado,
							fechaCreacion: ticket.fechaCreacion,
							imagen: ticket.imagen,
						}))}
						onSelectTicket={(ticket) =>
							setSelectedTicket({
								...ticket,
								fechaCreacion: ticket.createdAt ? new Date(ticket.createdAt) : null,
								onDeleteTicket: () => handleDeleteTicket(ticket.id),
							})
						}
						onDeleteTicket={handleDeleteTicket}
					/>
					{selectedTicket && (
						<TicketDetail
							{...selectedTicket}
							onUpdateTicket={handleUpdateTicket}
							onDeleteTicket={() => setIsDeleteDialogOpen(true)}
						/>
					)}
				</div>
				{isChatOpen && (
					<div className="w-1/3 transition-all duration-300">
						<LiveChat />
						<Button
							onClick={() => setIsChatOpen(false)}
							className="mt-4 w-full"
						>
							Cerrar Chat
						</Button>
					</div>
				)}
			</div>

			<ConfirmationDialog
				isOpen={isDeleteDialogOpen}
				onClose={() => setIsDeleteDialogOpen(false)}
				onConfirm={() =>
					selectedTicket && handleDeleteTicket(selectedTicket.id)
				}
				title="Eliminar Ticket"
				description="¿Estás seguro de que quieres eliminar este ticket? Esta acción no se puede deshacer."
			/>
		</div>
	);
}
