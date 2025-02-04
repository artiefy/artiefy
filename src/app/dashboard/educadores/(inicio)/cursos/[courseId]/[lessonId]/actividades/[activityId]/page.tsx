'use client';
import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
//import CrearActividadOM from '~/components/educators/layout/CrearActividadOM';
//import CrearActividadSL from '~/components/educators/layout/CrearActividadSL';
//import CrearCrucigrama from '~/components/educators/layout/CrearCrucigrama';
import QuestionManager from '~/components/actividades/PreguntasOM';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '~/components/educators/ui/alert-dialog';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import { Button } from '~/components/educators/ui/button';
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

const getContrastYIQ = (hexcolor: string) => {
	if (!hexcolor) return 'black'; // Manejar el caso de color indefinido
	hexcolor = hexcolor.replace('#', '');
	const r = parseInt(hexcolor.substr(0, 2), 16);
	const g = parseInt(hexcolor.substr(2, 2), 16);
	const b = parseInt(hexcolor.substr(4, 2), 16);
	const yiq = (r * 299 + g * 587 + b * 114) / 1000;
	return yiq >= 128 ? 'black' : 'white';
};

const Page: React.FC = () => {
	const params = useParams();
	const actividadIdUrl = params?.activityId ?? null;
	const lessonsId = params?.lessonId ?? null;
	const courseId = params?.courseId ?? null;
	const [actividad, setActividad] = useState<ActivityDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [color, setColor] = useState<string>('#FFFFFF');

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

	useEffect(() => {
		const savedColor = localStorage.getItem(`selectedColor_${courseIdNumber}`);
		if (savedColor) {
			setColor(savedColor);
		}
		console.log(`Color guardado actividad: ${savedColor}`);
	}, [courseIdNumber]);

	const handleDeleteAct = async () => {
		if (actividadIdNumber) {
			try {
				const response = await fetch(
					`/api/educadores/actividades?id=${actividadIdNumber}`,
					{
						method: 'DELETE',
					}
				);

				if (response.ok) {
					toast({
						title: 'Actividad eliminada',
						description: 'La actividad se eliminó con éxito.',
					});
					window.history.back();
				} else {
					const errorData = (await response.json()) as { error?: string };
					toast({
						title: 'Error',
						description: errorData.error ?? 'Error al eliminar la actividad.',
						variant: 'destructive',
					});
				}
			} catch (error: unknown) {
				if ((error as Error).name === 'AbortError') {
					console.log('Delete cancelled');
					return;
				} else {
					const errorMessage =
						error instanceof Error ? error.message : 'Error desconocido';
					toast({
						title: 'Error',
						description: `Error al eliminar la actividad: ${errorMessage}`,
						variant: 'destructive',
					});
				}
			}
		}
	};

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
				<BreadcrumbList className="flex space-x-3 rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 p-2 text-white shadow-lg">
					<BreadcrumbItem>
						<BreadcrumbLink
							className="transition duration-300 hover:scale-105 hover:text-gray-300"
							href="/dashboard/educadores"
						>
							Cursos
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="transition duration-300 hover:scale-105 hover:text-gray-300"
							href="/dashboard/educadores/cursos"
						>
							Lista de cursos
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
			<div className="group relative h-auto w-full">
				<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100"></div>
				<div
					className="relative z-20 mx-auto mt-2 flex w-full max-w-7xl flex-col rounded-lg border border-gray-200 p-8 shadow-lg"
					style={{ backgroundColor: color, color: getContrastYIQ(color) }}
				>
					<div className="mb-3 grid grid-cols-1 items-center justify-between space-y-4 text-3xl font-semibold md:grid-cols-2">
						<h2 className="flex flex-col text-4xl font-extrabold">
							Actividad: <b>{actividad.name}</b>
						</h2>
						<h3 className="text-xl md:mr-8 lg:mr-24">
							Perteneciente a la clase: {actividad.lesson?.title}
						</h3>
					</div>
					<div className="my-4 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
						<div className="space-y-5 text-lg">
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
					<div className="flex justify-end">
						<Link
							href={`/dashboard/educadores/cursos/${courseIdNumber}/${lessonIdNumber}/actividades/${actividadIdNumber}/verActividad`}
							className="mb-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
						>
							Realizar Actividad
						</Link>
					</div>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button className="mx-auto my-4 w-1/6 border-red-600 bg-red-600 text-white hover:border-red-600 hover:bg-white hover:text-red-600">
								Eliminar
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
								<AlertDialogDescription>
									Esta acción no se puede deshacer. Se eliminará permanentemente
									la actividad
									<span className="font-bold">
										{' '}
										{actividad?.name}, del tipo: {actividad?.type?.name}
									</span>{' '}
									y todos los datos asociados a este.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancelar</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDeleteAct}
									className="border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-transparent hover:text-red-700"
								>
									Eliminar
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
					{/* Zona de actividades */}
					{actividad?.type?.id === 1 && (
						// <CrearActividadSL />
						<div>En construccion</div>
					)}
					{actividad?.type?.id === 2 && actividadIdNumber !== null && (
						// <CrearActividadOM activityId={actividadIdNumber} />
						<QuestionManager activityId={actividadIdNumber} />
					)}
					{actividad?.type?.id === 3 && (
						// <CrearCrucigrama />
						<div>En construccion</div>
					)}
					{actividad?.type?.id !== 1 &&
						actividad?.type?.id !== 2 &&
						actividad?.type?.id !== 3 && (
							<div className="text-center text-xl text-red-500">
								No se encontró la actividad.
							</div>
						)}
				</div>
			</div>
		</>
	);
};

export default Page;
