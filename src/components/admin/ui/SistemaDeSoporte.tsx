'use client';

import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '~/components/admin/ui/dialog';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '~/components/admin/ui/tabs';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/admin/ui/card';
import { Button } from '~/components/admin/ui/button';
import { Input } from '~/components/admin/ui/input';
import { DetallesTicket } from './DetallesTicket';
import { FormularioCrearTicket } from './FormularioCrearTicket';
import { GestionTecnicos } from './GestionTecnicos';
import { ListaTickets } from './ListaTickets';
import { exportarACSV } from './utilidadesExportacion';
import ChatButton from './ChatButton';
import { FiltrosTickets } from './FiltrosTickets';
import { CreateTicketInput } from '~/types/Tickets';

export interface Ticket {
	id: string;
	titulo: string;
	estado: 'pendiente' | 'en_proceso' | 'critico' | 'completado';
	asignadoA: string | null;
	prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
	fecha: string;
	descripcion: string;
	urlImagen?: string | null;
	fechaCreacion: string;
	fechaResolucion?: string;
	tiempoEstimado?: number;
	categorias: string[];
	archivado: boolean;
}

interface Tecnico {
	id: string;
	nombre: string;
	apellido: string;
	cedula: string;
	correo: string;
	rol: 'tecnico' | 'admin' | 'superadmin';
	ticketsAsignados: number;
	etiquetasAsignadas: string[];
}

const categoriasDisponibles = [
	'Hardware',
	'Software',
	'Red',
	'Seguridad',
	'Base de datos',
	'Aplicación web',
	'Aplicación móvil',
	'Otros',
];

const SistemaDeSoporte = () => {
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
	const [ticketSeleccionado, setTicketSeleccionado] = useState<Ticket | null>(
		null
	);
	const [estaCreando, setEstaCreando] = useState(false);
	const [filtros, setFiltros] = useState({
		terminoBusqueda: '',
		estado: '',
		prioridad: '',
		fechaInicio: '',
		fechaFin: '',
		tecnicoAsignado: '',
		categorias: [],
	});
	const [vistaActual, setVistaActual] = useState<
		'todos' | 'asignados' | 'noAsignados' | 'archivados'
	>('todos');

	useEffect(() => {
		const fetchTickets = async () => {
			const ticketsData = await fetch('/api/tickets').then((res) => res.json());
			const tickets: Ticket[] = ticketsData.map((ticket: any) => ({
				id: ticket.id,
				titulo: ticket.titulo,
				estado: ticket.estado,
				asignadoA: ticket.asignadoA,
				prioridad: ticket.prioridad,
				fecha: ticket.fecha,
				descripcion: ticket.descripcion,
				urlImagen: ticket.urlImagen,
				fechaCreacion: ticket.fechaCreacion,
				fechaResolucion: ticket.fechaResolucion,
				tiempoEstimado: ticket.tiempoEstimado,
				categorias: ticket.categorias,
				archivado: ticket.archivado,
			}));
			setTickets(tickets);
		};
		fetchTickets();
	}, []);

	const agregarTicket = async (nuevoTicket: CreateTicketInput) => {
		const ticketData = await fetch('/api/tickets', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(nuevoTicket),
		}).then((res) => res.json());

		const ticket: Ticket = {
			id: ticketData.id.toString(),
			titulo: ticketData.titulo,
			estado: ticketData.estado ? 'pendiente' : 'completado', // Adjust this logic based on your actual status mapping
			asignadoA: ticketData.asignadoA,
			prioridad: ticketData.prioridad,
			descripcion: ticketData.descripcion,
			urlImagen: ticketData.urlImagen,
			fecha: ticketData.fecha, // Ensure this property is present
			fechaCreacion: ticketData.fechaCreacion,
			categorias: ticketData.categorias,
			archivado: ticketData.archivado,
		};
		setTickets([...tickets, ticket]);
		setEstaCreando(false);
	};

	const actualizarTicket = (ticketActualizado: Ticket) => {
		setTickets(
			tickets.map((t) => {
				if (t.id === ticketActualizado.id) {
					// Si el ticket se marca como completado, también se archiva
					if (ticketActualizado.estado === 'completado') {
						return { ...ticketActualizado, archivado: true };
					}
					return ticketActualizado;
				}
				return t;
			})
		);
	};

	const ticketsFiltrados = tickets.filter((ticket) => {
		if (vistaActual === 'archivados' && !ticket.archivado) return false;
		if (vistaActual !== 'archivados' && ticket.archivado) return false;
		if (vistaActual === 'asignados' && !ticket.asignadoA) return false;
		if (vistaActual === 'noAsignados' && ticket.asignadoA) return false;

		return (
			(filtros.terminoBusqueda === '' ||
				ticket.titulo
					.toLowerCase()
					.includes(filtros.terminoBusqueda.toLowerCase()) ||
				ticket.id
					.toLowerCase()
					.includes(filtros.terminoBusqueda.toLowerCase())) &&
			(filtros.estado === '' || ticket.estado === filtros.estado) &&
			(filtros.prioridad === '' || ticket.prioridad === filtros.prioridad) &&
			(filtros.tecnicoAsignado === '' ||
				ticket.asignadoA === filtros.tecnicoAsignado) &&
			(filtros.fechaInicio === '' ||
				new Date(ticket.fechaCreacion) >= new Date(filtros.fechaInicio)) &&
			(filtros.fechaFin === '' ||
				new Date(ticket.fechaCreacion) <= new Date(filtros.fechaFin)) &&
			(filtros.categorias.length === 0 ||
				filtros.categorias.some((cat) => ticket.categorias.includes(cat)))
		);
	});

	return (
		<div className="text-foreground min-h-screen bg-[#01142B] p-6">
			<h1 className="text-primary mb-6 text-3xl font-bold">
				Gestión de Tickets
			</h1>

			<div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<BurbujaTicket
					titulo="Total de Tickets"
					cantidad={tickets.filter((t) => !t.archivado).length}
					onClick={() => {
						setVistaActual('todos');
						setFiltros({ ...filtros, estado: '', categorias: [] });
					}}
					className="bg-card text-card-foreground"
				/>
				<BurbujaTicket
					titulo="Tickets Pendientes"
					cantidad={
						tickets.filter((t) => t.estado === 'pendiente' && !t.archivado)
							.length
					}
					onClick={() => {
						setVistaActual('todos');
						setFiltros({ ...filtros, estado: 'pendiente', categorias: [] });
					}}
					className="bg-yellow-500 text-yellow-50"
				/>
				<BurbujaTicket
					titulo="Tickets Críticos"
					cantidad={
						tickets.filter((t) => t.estado === 'critico' && !t.archivado).length
					}
					onClick={() => {
						setVistaActual('todos');
						setFiltros({ ...filtros, estado: 'critico', categorias: [] });
					}}
					className="bg-red-500 text-red-50"
				/>
				<BurbujaTicket
					titulo="Tickets Archivados"
					cantidad={tickets.filter((t) => t.archivado).length}
					onClick={() => {
						setVistaActual('archivados');
						setFiltros({ ...filtros, estado: '', categorias: [] });
					}}
					className="bg-green-500 text-green-50"
				/>
			</div>

			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Input
						type="text"
						placeholder="Buscar tickets..."
						value={filtros.terminoBusqueda}
						onChange={(e) =>
							setFiltros({ ...filtros, terminoBusqueda: e.target.value })
						}
						className="max-w-xs"
					/>
					<FiltrosTickets
						filtros={filtros}
						tecnicos={tecnicos}
						onFiltrosChangeAction={setFiltros}
						categoriasDisponibles={categoriasDisponibles}
					/>
				</div>
				<div className="flex items-center gap-2">
					<Button
						onClick={() => setEstaCreando(true)}
						className="bg-primary hover:bg-primary/90 text-gray-800"
					>
						Crear Ticket
					</Button>
					<Button
						onClick={() => exportarACSV(tickets)}
						variant="outline"
						className="bg-primary hover:bg-primary/90 text-gray-800"
					>
						Exportar
					</Button>
					<GestionTecnicos
						tecnicos={tecnicos}
						setTecnicosAction={setTecnicos}
						categoriasDisponibles={categoriasDisponibles}
					/>
				</div>
			</div>

			<Tabs
				value={vistaActual}
				onValueChange={(value) => setVistaActual(value as typeof vistaActual)}
				className="w-full"
			>
				<TabsList className="bg-card text-card-foreground">
					<TabsTrigger value="todos">Todos</TabsTrigger>
					<TabsTrigger value="asignados">Asignados</TabsTrigger>
					<TabsTrigger value="noAsignados">No Asignados</TabsTrigger>
					<TabsTrigger value="archivados">Archivados</TabsTrigger>
				</TabsList>
				<TabsContent value="todos">
					<ListaTickets
						tickets={ticketsFiltrados}
						onSeleccionarTicket={setTicketSeleccionado}
					/>
				</TabsContent>
				<TabsContent value="asignados">
					<ListaTickets
						tickets={ticketsFiltrados.filter((t) => t.asignadoA !== null)}
						onSeleccionarTicket={setTicketSeleccionado}
					/>
				</TabsContent>
				<TabsContent value="noAsignados">
					<ListaTickets
						tickets={ticketsFiltrados.filter((t) => t.asignadoA === null)}
						onSeleccionarTicket={setTicketSeleccionado}
					/>
				</TabsContent>
				<TabsContent value="archivados">
					<ListaTickets
						tickets={ticketsFiltrados}
						onSeleccionarTicket={setTicketSeleccionado}
					/>
				</TabsContent>
			</Tabs>

			<Dialog open={estaCreando} onOpenChange={setEstaCreando}>
				<DialogContent className="bg-card text-card-foreground max-w-4xl rounded-lg p-6 shadow-lg">
					<DialogHeader>
						<DialogTitle>Crear Nuevo Ticket</DialogTitle>
						<DialogDescription>
							Complete los detalles del nuevo ticket a continuación.
						</DialogDescription>
					</DialogHeader>
					<FormularioCrearTicket
						onCerrarAction={() => setEstaCreando(false)}
						onEnviarAction={agregarTicket}
						categoriasDisponibles={categoriasDisponibles}
					/>
				</DialogContent>
			</Dialog>

			{ticketSeleccionado && (
				<Dialog
					open={!!ticketSeleccionado}
					onOpenChange={() => setTicketSeleccionado(null)}
				>
					<DialogContent className="bg-card text-card-foreground max-h-[90vh] max-w-4xl overflow-y-auto rounded-lg p-6 shadow-lg">
						<DialogHeader className="border-card-foreground mb-4 border-b pb-4">
							<DialogTitle className="text-primary mb-2 text-2xl font-bold">
								Detalles del Ticket
							</DialogTitle>
						</DialogHeader>
						<DetallesTicket
							ticket={ticketSeleccionado}
							onCerrarAction={() => setTicketSeleccionado(null)}
							onActualizarAction={actualizarTicket}
							tecnicos={tecnicos}
							categoriasDisponibles={categoriasDisponibles}
						/>
					</DialogContent>
				</Dialog>
			)}

			<ChatButton />
		</div>
	);
};

const BurbujaTicket = ({
	titulo,
	cantidad,
	onClick,
	className,
}: {
	titulo: string;
	cantidad: number;
	onClick: () => void;
	className?: string;
}) => (
	<Card
		className={`cursor-pointer transition-all hover:scale-105 ${className}`}
		onClick={onClick}
	>
		<CardHeader className="pb-2">
			<CardTitle className="text-lg">{titulo}</CardTitle>
		</CardHeader>
		<CardContent>
			<p className="text-3xl font-bold">{cantidad}</p>
		</CardContent>
	</Card>
);

export default SistemaDeSoporte;
