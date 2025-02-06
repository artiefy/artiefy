'use client';

import { useState } from 'react';
import {
	ClipboardList,
	Users,
	Clock,
	Search,
	Pencil,
	Eye,
} from 'lucide-react';
import { Button } from '~/components/admin/ui/button';
import { Card } from '~/components/admin/ui/card';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '~/components/admin/ui/dialog';
import { EvaluacionForm } from '~/components/admin/ui/EvaluacionForm';
import { Input } from '~/components/admin/ui/input';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/admin/ui/table';

interface Evaluacion {
	id: number;
	nombre: string;
	curso: string;
	tipoPreguntas: string;
	duracion: string;
	puntajeMaximo: number;
}

export default function Evaluaciones() {
	const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([
		{
			id: 1,
			nombre: 'Examen Final - Programación',
			curso: 'Introducción a la Programación',
			tipoPreguntas: 'Opción múltiple, Respuesta corta',
			duracion: '2 horas',
			puntajeMaximo: 100,
		},
		{
			id: 2,
			nombre: 'Quiz - Diseño UX',
			curso: 'Diseño UX/UI',
			tipoPreguntas: 'Verdadero/Falso, Opción múltiple',
			duracion: '30 minutos',
			puntajeMaximo: 50,
		},
	]);

	const handleAddEvaluacion = (nuevaEvaluacion: Omit<Evaluacion, 'id'>) => {
		setEvaluaciones((prevEvaluaciones) => [
			...prevEvaluaciones,
			{ ...nuevaEvaluacion, id: prevEvaluaciones.length + 1 },
		]);
	};

	return (
		<div className="min-h-screen p-6 text-white">
			<h2 className="mb-8 text-2xl font-semibold">Gestión de Evaluaciones</h2>

			<div className="grid gap-6">
				{/* Métricas */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Card className="bg-white p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600">Total Evaluaciones</p>
								<h3 className="mt-1 text-3xl font-bold text-gray-900">
									{evaluaciones.length}
								</h3>
							</div>
							<ClipboardList className="size-8 text-cyan-400" />
						</div>
						<button className="mt-4 text-sm text-cyan-500 hover:text-cyan-600">
							Ver detalles →
						</button>
					</Card>

					<Card className="items-center justify-between bg-white p-6">
						<div className="flex w-full items-center justify-between">
							<div>
								<p className="items-center text-sm text-gray-600">
									Estudiantes Evaluados
								</p>
								<h3 className="mt-1 text-3xl font-bold text-gray-900">250</h3>
							</div>
							<Users className="size-8 text-cyan-400" />
						</div>
						<button className="mt-4 text-sm text-cyan-500 hover:text-cyan-600">
							Ver detalles →
						</button>
					</Card>

					<Card className="bg-white p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="items-center text-sm text-gray-600">
									Tiempo Promedio
								</p>
								<h3 className="mt-1 text-3xl font-bold text-gray-900">
									45 min
								</h3>
							</div>
							<Clock className="size-8 text-cyan-400" />
						</div>
						<button className="mt-4 text-sm text-cyan-500 hover:text-cyan-600">
							Ver detalles →
						</button>
					</Card>
				</div>

				{/* Acciones Rápidas */}
				<div className="grid grid-cols-1 items-center justify-between gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8">
					<Button
						variant="outline"
						className="h-12 items-center border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 hover:text-white"
					>
						Gestionar Evaluaciones
					</Button>
					<Button
						variant="outline"
						className="h-12 items-center border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 hover:text-white"
					>
						Ver Estudiantes
					</Button>
				</div>

				{/* Buscador y Crear */}
				<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
					<div className="relative w-full sm:w-96">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
						<Input
							placeholder="Buscar evaluaciones..."
							className="w-full border-0 bg-white pl-10 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-cyan-400"
						/>
					</div>
					<Dialog>
						<DialogTrigger asChild>
							<Button className="w-full bg-cyan-500 text-white hover:bg-cyan-600 sm:ml-4 sm:mt-0 sm:w-auto">
								Crear Evaluación
							</Button>
						</DialogTrigger>
						<DialogContent className="border-0 bg-white text-gray-900">
							<DialogHeader>
								<DialogTitle>Crear Nueva Evaluación</DialogTitle>
							</DialogHeader>
							<EvaluacionForm onSubmit={handleAddEvaluacion} />
						</DialogContent>
					</Dialog>
				</div>

				{/* Tabla */}
				<Card className="overflow-hidden bg-white">
					<Table>
						<TableHeader>
							<TableRow className="border-b border-gray-200 hover:bg-gray-50">
								<TableHead className="text-gray-600">Nombre</TableHead>
								<TableHead className="text-gray-600">Curso</TableHead>
								<TableHead className="text-gray-600">
									Tipo de Preguntas
								</TableHead>
								<TableHead className="text-gray-600">Duración</TableHead>
								<TableHead className="text-gray-600">Puntaje Máximo</TableHead>
								<TableHead className="text-gray-600">Acciones</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{evaluaciones.map((evaluacion) => (
								<TableRow
									key={evaluacion.id}
									className="border-b border-gray-200 hover:bg-gray-50"
								>
									<TableCell className="text-gray-900">
										{evaluacion.nombre}
									</TableCell>
									<TableCell className="text-gray-900">
										{evaluacion.curso}
									</TableCell>
									<TableCell className="text-gray-900">
										{evaluacion.tipoPreguntas}
									</TableCell>
									<TableCell className="text-gray-900">
										{evaluacion.duracion}
									</TableCell>
									<TableCell className="text-gray-900">
										{evaluacion.puntajeMaximo}
									</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button
												variant="ghost"
												size="sm"
												className="text-cyan-500 hover:bg-cyan-50 hover:text-cyan-600"
											>
												<Pencil className="mr-2 size-4" />
												Editar
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="text-cyan-500 hover:bg-cyan-50 hover:text-cyan-600"
											>
												<Eye className="mr-2 size-4 " />
												Ver Resultados
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Card>
			</div>
		</div>
	);
}
