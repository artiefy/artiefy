'use client';
import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import FormActCompletado from '~/components/educators/layout/FormActCompletado';
import QuestionSubidaList from '~/components/educators/layout/ListActSubidaFile';
import ListPreguntaAbierta from '~/components/educators/layout/ListPreguntaAbierta';
import PreguntasAbiertas from '~/components/educators/layout/PreguntasAbiertas';
import QuestionForm from '~/components/educators/layout/QuestionsForms';
import QuestionList from '~/components/educators/layout/QuestionsList';
import SeleccionActi from '~/components/educators/layout/SeleccionActi';
import QuestionVOFForm from '~/components/educators/layout/VerdaderoOFalseForm';
import QuestionVOFList from '~/components/educators/layout/VerdaderoOFalseList';
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
import { Badge } from '~/components/educators/ui/badge';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import { Button } from '~/components/educators/ui/button';
import VerRespuestasArchivos from '~/components/educators/VerRespuestasArchivos';
import { toast } from '~/hooks/use-toast';
import type {
	QuestionFilesSubida,
	Completado,
	VerdaderoOFlaso,
	Question,
} from '~/types/typesActi';

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
	nota: number;
	revisada: boolean;
	parametros: string;
	pesoNota: number;
	lesson: {
		id: number;
		title: string;
		coverImageKey: string;
		courseId: number;
		courseTitle: string;
		courseDescription: string;
		courseInstructor: string;
	};
	fechaMaximaEntrega: string | null;
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
	const [selectedActivityType, setSelectedActivityType] = useState<string>('');
	const [questions, setQuestions] = useState<string[]>([]);
	const [editingQuestion, setEditingQuestion] = useState<
		QuestionFilesSubida | Completado | VerdaderoOFlaso | Question | null
	>(null);

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
						description:
							'La actividad y todos sus archivos asociados se eliminaron con éxito.',
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

	const handleAddQuestion = () => {
		if (selectedActivityType) {
			setQuestions([selectedActivityType]); // Solo mantener el nuevo formulario
			setSelectedActivityType('');
		}
	};

	const handleFormSubmit = () => {
		setEditingQuestion(null);
		setQuestions([]);
	};

	const handleCancel = () => {
		setEditingQuestion(null);
		setQuestions([]); // Limpiar las preguntas para dejar de renderizar el formulario
	};
	if (loading) {
		return (
			<main className="flex h-screen flex-col items-center justify-center">
				<div className="size-32 animate-spin rounded-full border-y-2 border-primary">
					<span className="sr-only"></span>
				</div>
				<span className="text-primary">Cargando...</span>
			</main>
		);
	}

	if (error) {
		return (
			<main className="flex h-screen items-center justify-center">
				<div className="text-center">
					<p className="text-lg font-semibold text-red-500">
						Error tipo: {error}
					</p>
					<button
						onClick={fetchActividad}
						className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
					>
						Reintentar
					</button>
				</div>
			</main>
		);
	}

	if (!actividad)
		return (
			<div className="text-center text-xl">No se encontró la actividad.</div>
		);

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
							href={`/dashboard/educadores/cursos/${courseIdNumber}`}
						>
							Detalles curso
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							href={`/dashboard/educadores/cursos/${courseIdNumber}/${lessonIdNumber}`}
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
				</BreadcrumbList>
			</Breadcrumb>
			<div className="group relative h-auto w-full">
				<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100"></div>
				<div
					className="relative z-20 mx-auto mt-2 flex w-full max-w-7xl flex-col rounded-lg border border-gray-200 p-8 shadow-lg"
					style={{ backgroundColor: color, color: getContrastYIQ(color) }}
				>
					<div className="mb-3 grid grid-cols-1 items-center justify-between space-y-4 text-3xl font-semibold md:grid-cols-2">
						<h2 className="flex flex-col text-4xl font-extrabold text-primary">
							Actividad: <b>{actividad.name}</b>
						</h2>
						<h3 className="text-xl text-primary md:mr-8 lg:mr-24">
							Perteneciente a la clase: {actividad.lesson?.title}
						</h3>
					</div>
					<div className="my-4 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
						<div className="space-y-5 text-lg">
							<p className="font-semibold">
								Del docente:{' '}
								<Badge
									variant="outline"
									className="ml-1 w-fit border-primary bg-background text-primary hover:bg-black/70"
								>
									{actividad.lesson.courseInstructor}
								</Badge>
							</p>
							<p className="font-semibold">
								Tipo de actividad:{' '}
								<b className="text-primary">{actividad.type?.name}</b>
							</p>
							<p className="font-semibold">
								Permite: <b>{actividad.type?.description}</b>
							</p>
							<p className="w-11/12 font-semibold">
								Descripción de la actividad:{' '}
								<b className="w-11/12">{actividad.description}.</b>
							</p>
							<p className="font-semibold">
								¿La actividad es calificable?:{' '}
								<Badge
									variant="outline"
									className="ml-1 w-fit border-primary bg-background text-primary hover:bg-black/70"
								>
									{actividad.revisada ? 'Si' : 'No'}.
								</Badge>
							</p>
							<p className="font-semibold">
								Fecha máxima de entrega:{' '}
								<Badge
									variant="outline"
									className="ml-1 w-fit border-primary bg-background text-primary hover:bg-black/70"
								>
									{actividad.fechaMaximaEntrega
										? new Date(actividad.fechaMaximaEntrega).toLocaleString()
										: 'No tiene fecha máxima de entrega'}
									.
								</Badge>
							</p>
						</div>
						<div className="flex items-center justify-center">
							<div className="text-center">
								<Image
									src={
										actividad.lesson.coverImageKey
											? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${actividad.lesson.coverImageKey}`
											: `/favicon.ico`
									}
									alt="Imagen de la lección"
									width={250}
									height={250}
									className="rounded-lg shadow-md"
								/>
							</div>
						</div>
					</div>
					<div className="flex items-center justify-evenly space-x-4">
						<Link
							href={`/dashboard/educadores/cursos/${courseIdNumber}/${lessonIdNumber}/actividades/${actividadIdNumber}/verActividad`}
							className="rounded-lg bg-blue-500 px-4 py-1.5 text-white hover:bg-blue-600"
						>
							Realizar Actividad
						</Link>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button className="mx-auto w-1/3 border-red-600 bg-red-600 text-white hover:border-red-600 hover:bg-white hover:text-red-600 md:w-1/6 lg:w-1/6">
									Eliminar
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
									<AlertDialogDescription>
										Esta acción no se puede deshacer. Se eliminará
										permanentemente la actividad
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
					</div>
					{/* Zona de actividades */}
					{actividad?.type.id === 1 ? (
						<div className="mt-8 space-y-6">
							<div className="rounded-lg bg-white p-6 shadow-md">
								<div className="space-y-4">
									{actividadIdNumber !== null && (
										<>
											<div className="rounded-lg border border-gray-200 bg-white">
												<div className="rounded-lg bg-blue-50 p-4">
													<h2 className="text-center text-2xl font-bold text-gray-800">
														Gestión de Archivos y Calificaciones
													</h2>
													<p className="text-center text-sm text-black">
														En esta sección puedes gestionar los archivos
														subidos por los estudiantes y asignar
														calificaciones.
													</p>
												</div>
												<VerRespuestasArchivos
													activityId={actividadIdNumber.toString()}
												/>
											</div>
											{editingQuestion && 'parametros' in editingQuestion && (
												<FormActCompletado
													activityId={actividadIdNumber}
													editingQuestion={editingQuestion}
												/>
											)}
											<div className="rounded-lg border border-gray-200 bg-white p-6">
												<QuestionSubidaList activityId={actividadIdNumber} />
											</div>
										</>
									)}
								</div>
							</div>
						</div>
					) : actividad?.type.id === 2 ? (
						<>
							<SeleccionActi
								selectedColor={color}
								onSelectChange={setSelectedActivityType}
							/>
							{selectedActivityType && (
								<Button
									className={`mx-auto mb-4 w-2/4 border-slate-300 md:w-1/4 lg:w-1/4 ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`}
									onClick={handleAddQuestion}
								>
									Agregar Pregunta
								</Button>
							)}
							{questions.map((questionType, index) => (
								<div key={index}>
									{questionType === 'OM' && actividadIdNumber !== null && (
										<QuestionForm
											activityId={actividadIdNumber}
											onSubmit={handleFormSubmit}
											onCancel={handleCancel}
											isUploading={false}
											questionToEdit={editingQuestion as Question}
										/>
									)}
									{questionType === 'FOV' && actividadIdNumber !== null && (
										<QuestionVOFForm
											activityId={actividadIdNumber}
											onSubmit={handleFormSubmit}
											onCancel={handleCancel}
											isUploading={false}
											questionToEdit={editingQuestion as VerdaderoOFlaso}
										/>
									)}
									{questionType === 'COMPLETADO' &&
										actividadIdNumber !== null && (
											<PreguntasAbiertas
												activityId={actividadIdNumber}
												onSubmit={handleFormSubmit}
												onCancel={handleCancel}
												isUploading={false}
												questionToEdit={editingQuestion as Completado}
											/>
										)}
								</div>
							))}
							{actividadIdNumber !== null && (
								<>
									<QuestionVOFList activityId={actividadIdNumber} />
									<QuestionList activityId={actividadIdNumber} />
									<ListPreguntaAbierta activityId={actividadIdNumber} />
								</>
							)}
						</>
					) : (
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
