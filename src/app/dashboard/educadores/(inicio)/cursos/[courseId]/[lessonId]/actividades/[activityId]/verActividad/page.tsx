'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import ActSubida from '~/components/verActividades/ActSubida';
import VerListPreguntaAbierta from '~/components/verActividades/PreguntaCompletado';
import VerQuestionVOFList from '~/components/verActividades/PreguntaFOV';
import VerQuestionList from '~/components/verActividades/PreguntasOM';
import { toast } from '~/hooks/use-toast';

interface ActivityDetails {
	id: number;
	name: string;
	description: string;
	typeid: number;
	type: {
		id: number;
		name: string;
		description: string;
	};
	lesson: {
		id: number;
		title: string;
		coverImageKey: string;
		courseId: number;
		courseTitle: string;
		courseDescription: string;
		courseInstructor: string;
	};
}

const RealizarActividad: React.FC = () => {
	const params = useParams();
	const actividadIdUrl = params?.activityId ?? null;
	const [loading, setLoading] = useState(true);
	const [actividad, setActividad] = useState<ActivityDetails | null>(null);
	const [error, setError] = useState<string | null>(null);
	const actividadIdString = Array.isArray(actividadIdUrl)
		? actividadIdUrl[0]
		: actividadIdUrl;
	const actividadIdNumber = actividadIdString
		? parseInt(actividadIdString)
		: null;
	const fetchActividad = useCallback(async () => {
		if (actividadIdNumber !== null) {
			try {
				setLoading(true);
				setError(null);
				const response = await fetch(
					`/api/educadores/actividades/${actividadIdNumber}`
				);

				if (response.ok) {
					const data = (await response.json()) as ActivityDetails;
					setActividad(data);
				} else {
					const errorData = (await response.json()) as { error?: string };
					const errorMessage = errorData.error ?? response.statusText;
					setError(`Error al cargar la actividad: ${errorMessage}`);
					toast({
						title: 'Error',
						description: `No se pudo cargar la actividad: ${errorMessage}`,
						variant: 'destructive',
					});
				}
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : 'Error desconocido';
				setError(`Error al cargar la actividad: ${errorMessage}`);
				toast({
					title: 'Error',
					description: `No se pudo cargar la actividad: ${errorMessage}`,
					variant: 'destructive',
				});
			} finally {
				setLoading(false);
			}
		}
	}, [actividadIdNumber]);

	useEffect(() => {
		void fetchActividad();
	}, [fetchActividad]);

	if (loading) return <div>Cargando...</div>;
	if (error) return <div>Error: {error}</div>;

	return (
		<>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary transition duration-300 hover:scale-105 hover:text-gray-300"
							href="/dashboard/educadores"
						>
							Cursos
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary transition duration-300 hover:scale-105 hover:text-gray-300"
							href="/dashboard/educadores/cursos"
						>
							Lista de cursos
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary transition duration-300 hover:scale-105 hover:text-gray-300"
							href={`/dashboard/educadores/cursos`}
						>
							Detalles curso
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							href={`/dashboard/educadores/cursos`}
							className="text-primary transition duration-300 hover:scale-105 hover:text-gray-300"
						>
							Lección
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							href="#"
							onClick={() => window.history.back()}
							className="text-primary transition duration-300 hover:scale-105 hover:text-gray-300"
						>
							Creación de actividad
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							href="#"
							onClick={() => window.history.back()}
							className="text-primary transition duration-300 hover:scale-105 hover:text-gray-300"
						>
							Realizacion de actividad
						</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<div className="h-auto rounded-lg bg-gradient-to-br from-primary to-indigo-500 p-8 text-indigo-500">
				<div className="max-w-6xl px-4">
					<header className="mb-8">
						{actividad && (
							<>
								<h1 className="mb-2 text-center text-3xl font-bold text-gray-800">
									{actividad.name}
								</h1>
								<p className="text-center text-gray-600">
									{actividad.description}
								</p>
								<p className="text-center text-gray-600">
									Docente: {actividad.lesson.courseInstructor}
								</p>
								{actividad.type.id === 1 ? (
										<ActSubida activityId={actividad.id} />
								) : actividad.type.id === 2 ? (
									<>
										<VerQuestionList activityId={actividad.id} />
										<VerListPreguntaAbierta activityId={actividad.id} />
										<VerQuestionVOFList activityId={actividad.id} />
									</>
								) : (
									<p>
										Actividad no encontrada, escribenos y comentanos que
										actividad te gustaria ver aqui en Artiefy!!.
									</p>
								)}
							</>
						)}
					</header>
				</div>
			</div>
		</>
	);
};

export default RealizarActividad;
