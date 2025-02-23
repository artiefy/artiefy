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

export interface Ticket {
	id: string;
	titulo: string;
	estado: 'pendiente' | 'en_proceso' | 'critico' | 'completado';
	asignadoA: string | null;
	prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
	fecha: string;
	descripcion: string;
	urlImagen?: string;
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
		// Cargar datos iniciales (reemplazar con llamadas API reales)
		setTickets([
			{
				id: 'TKT-001',
				titulo: 'Servidor Caído',
				estado: 'critico',
				asignadoA: 'Juan Pérez',
				prioridad: 'Alta',
				fecha: '2024-01-20',
				descripcion: 'El servidor principal no responde',
				fechaCreacion: '2024-01-20T10:00:00Z',
				categorias: ['Hardware', 'Red'],
				archivado: false,
			},
			{
				id: 'TKT-002',
				titulo: 'Problema con Cliente de Correo',
				estado: 'pendiente',
				asignadoA: null,
				prioridad: 'Media',
				fecha: '2024-01-19',
				descripcion: 'Los usuarios no pueden enviar correos',
				fechaCreacion: '2024-01-19T14:30:00Z',
				categorias: ['Software'],
				archivado: false,
			},
			{
				id: 'TKT-003',
				titulo: 'Actualización de Software Completada',
				estado: 'completado',
				asignadoA: 'Ana García',
				prioridad: 'Baja',
				fecha: '2024-01-18',
				descripcion: 'Actualización exitosa del software de gestión',
				fechaCreacion: '2024-01-18T09:00:00Z',
				fechaResolucion: '2024-01-18T11:30:00Z',
				categorias: ['Software'],
				archivado: true,
			},
		]);
		setTecnicos([
			{
				id: 'TECH-001',
				nombre: 'Juan',
				apellido: 'Pérez',
				cedula: '1234567890',
				correo: 'juan@example.com',
				rol: 'tecnico',
				ticketsAsignados: 1,
				etiquetasAsignadas: ['Hardware', 'Red'],
			},
			{
				id: 'TECH-002',
				nombre: 'Ana',
				apellido: 'García',
				cedula: '0987654321',
				correo: 'ana@example.com',
				rol: 'admin',
				ticketsAsignados: 1,
				etiquetasAsignadas: ['Software', 'Base de datos'],
			},
		]);
	}, []);

	const agregarTicket = (
		nuevoTicket: Omit<Ticket, 'id' | 'fecha' | 'fechaCreacion' | 'archivado'>
	) => {
		const ticket: Ticket = {
			...nuevoTicket,
			id: `TKT-${tickets.length + 1}`,
			fecha: new Date().toISOString().split('T')[0],
			fechaCreacion: new Date().toISOString(),
			archivado: false,
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
		<div className="min-h-screen bg-[#01142B] p-6 text-foreground">
			<h1 className="mb-6 text-3xl font-bold text-primary">
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
						className="bg-primary text-gray-800 hover:bg-primary/90"
					>
						Crear Ticket
					</Button>
					<Button
						onClick={() => exportarACSV(tickets)}
						variant="outline"
						className="bg-primary text-gray-800 hover:bg-primary/90"
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
				<DialogContent className='bg-card text-card-foreground rounded-lg shadow-lg p-6 max-w-4xl'>
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
					<DialogContent className="max-h-[90vh] max-w-4xl p-6 overflow-y-auto bg-card text-card-foreground rounded-lg shadow-lg">
						<DialogHeader className="mb-4 pb-4 border-b border-card-foreground">
							<DialogTitle className="text-2xl font-bold text-primary mb-2">
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
