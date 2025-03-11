import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/admin/ui/card';
import { Badge } from '~/components/admin/ui/badge';
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '~/components/admin/ui/avatar';
import type { Ticket } from './SistemaDeSoporte';

interface ListaTicketsProps {
	tickets: Ticket[];
	onSeleccionarTicket: (ticket: Ticket) => void;
}

export const ListaTickets = ({
	tickets,
	onSeleccionarTicket,
}: ListaTicketsProps) => {
	const getEstadoColor = (estado: Ticket['estado']) => {
		switch (estado) {
			case 'pendiente':
				return 'bg-yellow-500 text-yellow-50';
			case 'en_proceso':
				return 'bg-blue-500 text-blue-50';
			case 'critico':
				return 'bg-red-500 text-red-50';
			case 'completado':
				return 'bg-green-500 text-green-50';
			default:
				return 'bg-gray-500 text-gray-50';
		}
	};

	const getPrioridadColor = (prioridad: Ticket['prioridad']) => {
		switch (prioridad) {
			case 'Baja':
				return 'bg-green-200 text-green-800';
			case 'Media':
				return 'bg-yellow-200 text-yellow-800';
			case 'Alta':
				return 'bg-orange-200 text-orange-800';
			case 'Crítica':
				return 'bg-red-200 text-red-800';
			default:
				return 'bg-gray-200 text-gray-800';
		}
	};

	return (
		<div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
			{tickets.map((ticket) => (
				<Card
					key={ticket.id}
					className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md"
					onClick={() => onSeleccionarTicket(ticket)}
				>
					<CardHeader className="pb-2">
						<div className="flex items-start justify-between">
							<div>
								<CardTitle className="text-lg">{ticket.titulo}</CardTitle>
								<CardDescription>{ticket.id}</CardDescription>
							</div>
							<Badge className={getEstadoColor(ticket.estado)}>
								{ticket.estado}
							</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<p className="mb-2 line-clamp-2 text-sm">{ticket.descripcion}</p>
						<div className="mb-2 flex items-center justify-between">
							<Badge
								variant="outline"
								className={getPrioridadColor(ticket.prioridad)}
							>
								{ticket.prioridad}
							</Badge>
							<span className="text-muted-foreground text-sm">
								{new Date(ticket.fechaCreacion).toLocaleDateString()}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-2">
								<Avatar className="h-6 w-6">
									<AvatarImage src="/placeholder-user.jpg" />
									<AvatarFallback>
										{ticket.asignadoA
											? ticket.asignadoA.charAt(0).toUpperCase()
											: 'NA'}
									</AvatarFallback>
								</Avatar>
								<span className="text-sm">
									{ticket.asignadoA
										? `Asignado a: ${ticket.asignadoA}`
										: 'Sin asignar'}
								</span>
							</div>
							{ticket.tiempoEstimado && (
								<span className="text-muted-foreground text-sm">
									Estimado: {ticket.tiempoEstimado}h
								</span>
							)}
						</div>
						<div className="mt-2 flex flex-wrap gap-1">
							{ticket.categorias.map((categoria, index) => (
								<Badge
									key={`${ticket.id}-${categoria}-${index}`}
									variant="secondary"
									className="text-xs"
								>
									{categoria}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
};
