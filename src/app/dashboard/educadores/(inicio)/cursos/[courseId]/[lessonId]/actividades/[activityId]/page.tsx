'use client';
import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import CrearActividad from '~/components/educators/layout/CrearActividad';
import PreguntasOm from '~/components/educators/layout/CrearActividadOM';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
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

const Page = () => {
	const params = useParams();
	const actividadIdUrl = params?.activityId ?? null;
	const lessonsId = params?.lessonId ?? null;
	const courseId = params?.courseId ?? null;
	const [actividad, setActividad] = useState<ActivityDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const actividadIdString = Array.isArray(actividadIdUrl)
		? actividadIdUrl[0]
		: actividadIdUrl;
	const actividadIdNumber = actividadIdString
		? parseInt(actividadIdString)
		: null;
	const lessonIdString = Array.isArray(lessonsId) ? lessonsId[0] : lessonsId;
	const lessonIdNumber = lessonIdString ? parseInt(lessonIdString) : null;
	const courseIdString = Array.isArray(courseId) ? courseId[0] : courseId;
	const courseIdNumber = courseIdString ? parseInt(courseIdString) : null;

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
		fetchActividad().catch((error) =>
			console.error('Error fetching activity:', error)
		);
	}, [fetchActividad]);

	if (loading)
		return (
			<div className="animate-pulse text-center text-xl">
				Cargando actividad...
			</div>
		);
	if (error)
		return <div className="text-center text-xl text-red-500">{error}</div>;
	if (!actividad)
		return (
			<div className="text-center text-xl">No se encontró la actividad.</div>
		);

	return (
		<>
			<Breadcrumb>
				<BreadcrumbList className="flex space-x-3 rounded-lg bg-linear-to-r from-teal-500 to-blue-500 p-2 text-white shadow-lg">
					<BreadcrumbItem>
						<BreadcrumbLink
							className="transition duration-300 hover:scale-105 hover:text-gray-300"
							href="/dashboard/educadores/cursos"
						>
							Cursos
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="transition duration-300 hover:scale-105 hover:text-gray-300"
							href={`/dashboard/educadores/cursos/${courseIdNumber}`}
						>
							Detalles curso
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							href={`/dashboard/educadores/cursos/${courseIdNumber}/${lessonIdNumber}`}
							className="transition duration-300 hover:scale-105 hover:text-gray-300"
						>
							Lección
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							href="#"
							onClick={() => window.history.back()}
							className="transition duration-300 hover:scale-105 hover:text-gray-300"
						>
							Creación de actividad
						</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<div className="mx-auto mt-6 flex w-full max-w-7xl flex-col rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
				<div className="mb-3 grid grid-cols-1 items-center justify-between space-y-4 text-3xl font-semibold text-gray-800 md:grid-cols-2">
					<h2 className="text-primary text-4xl font-extrabold">
						Actividad: {actividad.name}
					</h2>
					<h3 className="text-xl text-gray-600 md:mr-8 lg:mr-24">
						Lección: {actividad.lesson?.title}
					</h3>
				</div>
				<div className="my-4 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
					<div className="space-y-5 text-lg text-gray-700">
						<p className="font-semibold">
							Del docente: <b>{actividad.lesson.courseInstructor}</b>
						</p>
						<p className="font-semibold">
							Tipo de actividad: <b>{actividad.type?.name}</b>
						</p>
						<p className="font-semibold">
							Permite: <b>{actividad.type?.description}</b>
						</p>
						<p className="font-semibold">
							Descripción de la actividad: <b>{actividad.description}.</b>
						</p>
					</div>
					<div className="flex items-center justify-center">
						<div className="text-center">
							<Image
								src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${actividad.lesson.coverImageKey}`}
								alt="Imagen de la lección"
								width={250}
								height={250}
								className="rounded-lg shadow-md"
							/>
						</div>
					</div>
				</div>
				{actividad.type.id === 1 && <CrearActividad />}
				{actividad.type.id === 2 && <PreguntasOm />}
				{actividad.type.id === 3 && <CrearActividad />}
				{actividad.type.id !== 1 &&
					actividad.type.id !== 2 &&
					actividad.type.id !== 3 && (
						<div className="text-center text-xl text-red-500">
							No se encontró la actividad.
						</div>
					)}
			</div>
		</>
	);
};

export default Page;
