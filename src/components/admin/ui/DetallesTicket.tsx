'use client';

import { useState } from 'react';
import { Button } from '~/components/admin/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/admin/ui/select';
import { Textarea } from '~/components/admin/ui/textarea';
import { Label } from '~/components/admin/ui/label';
import { Input } from '~/components/admin/ui/input';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '~/components/admin/ui/card';
import { Badge } from '~/components/admin/ui/badge';
import { Separator } from '~/components/admin/ui/separator';
import { ScrollArea } from '~/components/admin/ui/scroll-area';
import {
	CalendarIcon,
	ClockIcon,
	UserIcon,
	AlertCircle,
	CheckCircle2,
	Timer,
} from 'lucide-react';
import type { Ticket as OriginalTicket } from './SistemaDeSoporte';
import { Ticket as TicketType } from '~/types/Tickets';

interface Ticket extends OriginalTicket {
	categorias: string[];
}
import { Checkbox } from '~/components/admin/ui/checkbox';

interface Tecnico {
	id: string;
	nombre: string;
	apellido: string;
	cedula: string;
	correo: string;
	rol: 'tecnico' | 'admin' | 'superadmin';
	ticketsAsignados: number;
}

interface DetallesTicketProps {
	ticket: Ticket;
	onCerrarAction: () => void;
	onActualizarAction: (ticket: Ticket) => void;
	tecnicos: Tecnico[];
	categoriasDisponibles?: string[];
}

export const DetallesTicket = ({
	ticket,
	onCerrarAction,
	onActualizarAction,
	tecnicos,
	categoriasDisponibles = [],
}: DetallesTicketProps) => {
	const [ticketEditado, setTicketEditado] = useState<Ticket>(ticket);

	const handleChange = (campo: keyof Ticket, valor: any) => {
		setTicketEditado({ ...ticketEditado, [campo]: valor });
	};

	const handleSubmit = async () => {
		await onActualizarAction(ticketEditado);
		onCerrarAction();
	};

	const calcularTiempoTranscurrido = (fechaCreacion: string) => {
		const ahora = new Date();
		const creacion = new Date(fechaCreacion);
		const diferencia = ahora.getTime() - creacion.getTime();
		const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
		const horas = Math.floor(
			(diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
		);
		const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
		return `${dias}d ${horas}h ${minutos}m`;
	};

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

	const getEstadoIcon = (estado: Ticket['estado']) => {
		switch (estado) {
			case 'critico':
				return <AlertCircle className="h-4 w-4" />;
			case 'completado':
				return <CheckCircle2 className="h-4 w-4" />;
			default:
				return <Timer className="h-4 w-4" />;
		}
	};

	return (
		<ScrollArea className="max-h-[80vh]">
			<div className="grid gap-6 p-1">
				<Card>
					<CardHeader className="space-y-1">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<CardTitle className="text-2xl font-bold">
									#{ticketEditado.id}
								</CardTitle>
								<CardDescription>
									Creado el{' '}
									{new Date(ticketEditado.fechaCreacion).toLocaleDateString()}
								</CardDescription>
							</div>
							<Badge
								className={`${getEstadoColor(ticketEditado.estado)} flex items-center gap-1`}
							>
								{getEstadoIcon(ticketEditado.estado)}
								{ticketEditado.estado}
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="titulo" className="text-base font-semibold">
								Título
							</Label>
							<Input
								id="titulo"
								value={ticketEditado.titulo}
								onChange={(e) => handleChange('titulo', e.target.value)}
								className="text-lg"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="descripcion" className="text-base font-semibold">
								Descripción
							</Label>
							<Textarea
								id="descripcion"
								value={ticketEditado.descripcion}
								onChange={(e) => handleChange('descripcion', e.target.value)}
								rows={4}
								className="resize-none"
							/>
						</div>

						<div className="bg-muted/50 grid grid-cols-1 gap-4 rounded-lg p-4 md:grid-cols-3">
							<div className="flex items-center gap-2">
								<CalendarIcon className="text-muted-foreground h-5 w-5" />
								<div className="space-y-1">
									<p className="text-sm font-medium">Fecha de Creación</p>
									<p className="text-muted-foreground text-sm">
										{new Date(ticketEditado.fechaCreacion).toLocaleString()}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<ClockIcon className="text-muted-foreground h-5 w-5" />
								<div className="space-y-1">
									<p className="text-sm font-medium">Tiempo Transcurrido</p>
									<p className="text-muted-foreground text-sm">
										{calcularTiempoTranscurrido(ticketEditado.fechaCreacion)}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<UserIcon className="text-muted-foreground h-5 w-5" />
								<div className="space-y-1">
									<p className="text-sm font-medium">Asignado a</p>
									<p className="text-muted-foreground text-sm">
										{ticketEditado.asignadoA || 'Sin asignar'}
									</p>
								</div>
							</div>
						</div>

						<Separator />

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="estado" className="text-base font-semibold">
									Estado
								</Label>
								<Select
									value={ticketEditado.estado}
									onValueChange={(valor) =>
										handleChange('estado', valor as Ticket['estado'])
									}
								>
									<SelectTrigger id="estado">
										<SelectValue placeholder="Seleccionar estado" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="pendiente">Pendiente</SelectItem>
										<SelectItem value="en_proceso">En Proceso</SelectItem>
										<SelectItem value="critico">Crítico</SelectItem>
										<SelectItem value="completado">Completado</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="prioridad" className="text-base font-semibold">
									Prioridad
								</Label>
								<Select
									value={ticketEditado.prioridad}
									onValueChange={(valor) =>
										handleChange('prioridad', valor as Ticket['prioridad'])
									}
								>
									<SelectTrigger id="prioridad">
										<SelectValue placeholder="Seleccionar prioridad" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Baja">Baja</SelectItem>
										<SelectItem value="Media">Media</SelectItem>
										<SelectItem value="Alta">Alta</SelectItem>
										<SelectItem value="Crítica">Crítica</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="asignadoA" className="text-base font-semibold">
								Asignar Técnico
							</Label>
							<Select
								value={ticketEditado.asignadoA || 'Sin asignar'}
								onValueChange={(valor) => handleChange('asignadoA', valor)}
							>
								<SelectTrigger id="asignadoA">
									<SelectValue placeholder="Seleccionar técnico" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Sin asignar">Sin asignar</SelectItem>
									{tecnicos.map((tecnico) => (
										<SelectItem
											key={tecnico.id}
											value={`${tecnico.nombre} ${tecnico.apellido}`}
										>
											{tecnico.nombre} {tecnico.apellido} ({tecnico.rol})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="tiempoEstimado"
								className="text-base font-semibold"
							>
								Tiempo Estimado de Resolución
							</Label>
							<div className="flex items-center gap-2">
								<Input
									id="tiempoEstimado"
									type="number"
									value={ticketEditado.tiempoEstimado || ''}
									onChange={(e) =>
										handleChange('tiempoEstimado', e.target.value)
									}
									className="max-w-[200px]"
								/>
								<span className="text-muted-foreground text-sm">horas</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label className="text-base font-semibold">Categorías</Label>
							{categoriasDisponibles.length > 0 ? (
								<div className="grid grid-cols-2 gap-2">
									{categoriasDisponibles.map((categoria) => (
										<div
											className="flex items-center space-x-2"
											key={categoria}
										>
											<Checkbox
												id={`categoria-${categoria}`}
												checked={ticketEditado.categorias.includes(categoria)}
												onCheckedChange={(checked) => {
													if (checked) {
														handleChange('categorias', [
															...ticketEditado.categorias,
															categoria,
														]);
													} else {
														handleChange(
															'categorias',
															ticketEditado.categorias.filter(
																(cat) => cat !== categoria
															)
														);
													}
												}}
											/>
											<Label htmlFor={`categoria-${categoria}`}>
												{categoria}
											</Label>
										</div>
									))}
								</div>
							) : (
								<p className="text-muted-foreground text-sm">
									No hay categorías disponibles.
								</p>
							)}
						</div>

						<Separator />

						<div className="space-y-2">
							<Label className="text-base font-semibold">
								Imagen del Problema
							</Label>
							<Card className="border-dashed">
								<CardContent className="pt-4">
									<Input
										id="imagen"
										type="file"
										accept="image/*"
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (file) {
												const reader = new FileReader();
												reader.onloadend = () => {
													handleChange('urlImagen', reader.result as string);
												};
												reader.readAsDataURL(file);
											}
										}}
									/>
									{ticketEditado.urlImagen && (
										<div className="relative mt-4 aspect-video">
											<img
												src={ticketEditado.urlImagen || '/placeholder.svg'}
												alt="Problema"
												className="h-full w-full rounded-lg object-cover"
											/>
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					</CardContent>
				</Card>

				<div className="flex justify-end space-x-4 text-white">
					<Button onClick={onCerrarAction} variant="outline">
						Cancelar
					</Button>
					<Button className="text-gray-800" onClick={handleSubmit}>
						Guardar cambios
					</Button>
				</div>
			</div>
		</ScrollArea>
	);
};
