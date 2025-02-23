'use client';

import { useState } from 'react';
import { Button } from '~/components/admin/ui/button';
import { Calendar } from '~/components/admin/ui/calendar';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/admin/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/admin/ui/select';
import { Label } from '~/components/admin/ui/label';
import { CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Checkbox } from '~/components/admin/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '~/components/admin/ui/dialog';

interface FiltrosTicketsProps {
	filtros: {
		estado: string;
		prioridad: string;
		fechaInicio: string;
		fechaFin: string;
		tecnicoAsignado: string;
		categorias: string[];
	};
	tecnicos: Array<{ id: string; nombre: string; apellido: string }>;
	onFiltrosChangeAction: (filtros: any) => void;
	categoriasDisponibles: string[];
}

export function FiltrosTickets({
	filtros,
	tecnicos,
	onFiltrosChangeAction,
	categoriasDisponibles,
}: FiltrosTicketsProps) {
	const [fechaInicioAbierta, setFechaInicioAbierta] = useState(false);
	const [fechaFinAbierta, setFechaFinAbierta] = useState(false);

	const contenidoFiltros = (
		<Card className="w-full">
			<CardHeader className='bg-gray-100'>
				<CardTitle>Filtros de Tickets</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
					<div className="space-y-2">
						<Label>Estado</Label>
						<Select
							value={filtros.estado}
							onValueChange={(valor) =>
								onFiltrosChangeAction({ ...filtros, estado: valor })
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Seleccionar estado" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todos</SelectItem>
								<SelectItem value="pendiente">Pendiente</SelectItem>
								<SelectItem value="en_proceso">En Proceso</SelectItem>
								<SelectItem value="critico">Crítico</SelectItem>
								<SelectItem value="completado">Completado</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Prioridad</Label>
						<Select
							value={filtros.prioridad}
							onValueChange={(valor) =>
								onFiltrosChangeAction({ ...filtros, prioridad: valor })
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Seleccionar prioridad" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todas">Todas</SelectItem>
								<SelectItem value="Baja">Baja</SelectItem>
								<SelectItem value="Media">Media</SelectItem>
								<SelectItem value="Alta">Alta</SelectItem>
								<SelectItem value="Crítica">Crítica</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="">
						<Label>Fecha Inicio</Label>
						<div className="bg-white flex items-center">
							<Button
								variant="outline"
								className=" w-full justify-start text-left font-normal"
								onClick={() => setFechaInicioAbierta(true)}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{filtros.fechaInicio ? (
									format(new Date(filtros.fechaInicio), 'PPP', { locale: es })
								) : (
									<span>Seleccionar fecha</span>
								)}
							</Button>
						</div>
						{fechaInicioAbierta && (
							<Calendar
								mode="single"
								selected={
									filtros.fechaInicio
										? new Date(filtros.fechaInicio)
										: undefined
								}
								onSelect={(date) => {
									onFiltrosChangeAction({
										...filtros,
										fechaInicio: date ? date.toISOString().split('T')[0] : '',
									});
									setFechaInicioAbierta(false);
								}}
								initialFocus
							/>
						)}
					</div>

					<div className="space-y-2">
						<Label>Fecha Fin</Label>
						<div className="flex items-center">
							<Button
								variant="outline"
								className="w-full justify-start text-left font-normal"
								onClick={() => setFechaFinAbierta(true)}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{filtros.fechaFin ? (
									format(new Date(filtros.fechaFin), 'PPP', { locale: es })
								) : (
									<span>Seleccionar fecha</span>
								)}
							</Button>
						</div>
						{fechaFinAbierta && (
							<Calendar
								mode="single"
								selected={
									filtros.fechaFin ? new Date(filtros.fechaFin) : undefined
								}
								onSelect={(date) => {
									onFiltrosChangeAction({
										...filtros,
										fechaFin: date ? date.toISOString().split('T')[0] : '',
									});
									setFechaFinAbierta(false);
								}}
								initialFocus
							/>
						)}
					</div>

					<div className="space-y-2">
						<Label>Técnico Asignado</Label>
						<Select
							value={filtros.tecnicoAsignado}
							onValueChange={(valor) =>
								onFiltrosChangeAction({ ...filtros, tecnicoAsignado: valor })
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Seleccionar técnico" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todos</SelectItem>
								{tecnicos.map((tecnico) => (
									<SelectItem key={tecnico.id} value={tecnico.nombre}>
										{tecnico.nombre} {tecnico.apellido}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Categorías</Label>
						<div className="grid grid-cols-2 gap-2">
							{categoriasDisponibles.map((categoria) => (
								<div className="flex items-center space-x-2" key={categoria}>
									<Checkbox
										id={`filtro-categoria-${categoria}`}
										checked={filtros.categorias.includes(categoria)}
										onCheckedChange={(checked) => {
											if (checked) {
												onFiltrosChangeAction({
													...filtros,
													categorias: [...filtros.categorias, categoria],
												});
											} else {
												onFiltrosChangeAction({
													...filtros,
													categorias: filtros.categorias.filter(
														(cat) => cat !== categoria
													),
												});
											}
										}}
									/>
									<Label htmlFor={`filtro-categoria-${categoria}`}>
										{categoria}
									</Label>
								</div>
							))}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" className="flex items-center gap-2 ">
					<Filter className="h-4 w-4" />
					Filtros
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[800px]">
				<DialogHeader>
					<DialogTitle>Filtros de Tickets</DialogTitle>
				</DialogHeader>
				{contenidoFiltros}
			</DialogContent>
		</Dialog>
	);
}
