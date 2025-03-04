'use client';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LoadingCourses } from '~/app/dashboard/educadores/(inicio)/cursos/page';
import DashboardEstudiantes from '~/components/educators/layout/DashboardEstudiantes';
import LessonsListEducator from '~/components/educators/layout/LessonsListEducator'; // Importar el componente
import ModalFormCourse from '~/components/educators/modals/ModalFormCourse';
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
import { Card, CardHeader, CardTitle } from '~/components/educators/ui/card';
import { Label } from '~/components/educators/ui/label';

interface Course {
	id: number;
	title: string;
	description: string;
	categoryid: string;
	dificultadid: string;
	modalidadesid: string;
	instructor: string;
	coverImageKey: string;
	creatorId: string;
	createdAt: string;
	updatedAt: string;
	requerimientos: string;
	rating: number; // Añadir esta línea
}
interface CourseDetailProps {
	courseId: number;
}

export interface Parametros {
	id: number;
	name: string;
	description: string;
	porcentaje: number;
	courseId: number;
}

const getContrastYIQ = (hexcolor: string) => {
	if (hexcolor === '#FFFFFF') return 'black'; // Manejar el caso del color blanco
	hexcolor = hexcolor.replace('#', '');
	const r = parseInt(hexcolor.substr(0, 2), 16);
	const g = parseInt(hexcolor.substr(2, 2), 16);
	const b = parseInt(hexcolor.substr(4, 2), 16);
	const yiq = (r * 299 + g * 587 + b * 114) / 1000;
	return yiq >= 128 ? 'black' : 'white';
};

const CourseDetail: React.FC<CourseDetailProps> = () => {
	const router = useRouter();
	const params = useParams();
	const courseIdUrl = params?.courseId;
	const [course, setCourse] = useState<Course | null>(null);
	const [parametros, setParametros] = useState<Parametros[]>([]); // Nuevo estado para los parámetros
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editTitle, setEditTitle] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [editRequerimientos, setEditRequerimientos] = useState('');
	const [editCategory, setEditCategory] = useState(0);
	const [editModalidad, setEditModalidad] = useState(0);
	const [editDificultad, setEditDificultad] = useState(0);
	const [editCoverImageKey, setEditCoverImageKey] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF'); // Color predeterminado blanco
	const predefinedColors = ['#000000', '#FFFFFF', '#1f2937']; // Colores específicos
	const [editParametros, setEditParametros] = useState<
		{
			id: number;
			name: string;
			description: string;
			porcentaje: number;
		}[]
	>([]); // Nuevo estado para los parámetros
	const [editRating, setEditRating] = useState(0); // Añadir esta línea

	const courseIdString = Array.isArray(courseIdUrl)
		? courseIdUrl[0]
		: courseIdUrl;
	const courseIdString2 = courseIdString ?? '';
	const courseIdNumber = parseInt(courseIdString2);
	console.log('courseIdNumber', courseIdNumber);

	const fetchCourse = useCallback(async () => {
		if (courseIdNumber !== null) {
			try {
				setLoading(true);
				setError(null);
				const response = await fetch(
					`/api/educadores/courses/${courseIdNumber}`
				);
				const responseParametros = await fetch(
					`/api/educadores/parametros?courseId=${courseIdNumber}`
				); // Obtener los parámetros

				if (!response.ok || !responseParametros.ok) {
					throw new Error(response.statusText);
				}
				if (response.ok && responseParametros.ok) {
					const data = (await response.json()) as Course;
					setCourse(data);
					const dataParametros =
						(await responseParametros.json()) as Parametros[]; // Obtener los parámetros
					setParametros(dataParametros); // Inicializar los parámetros
				} else {
					const errorData = (await response.json()) as { error?: string };
					const errorMessage = errorData.error ?? response.statusText;
					setError(`Error al cargar el curso: ${errorMessage}`);
					toast('Error', {
						description: `No se pudo cargar el curso: ${errorMessage}`,
					});
				}
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : 'Error desconocido';
				setError(`Error al cargar el curso: ${errorMessage}`);
				toast('Error', {
					description: `No se pudo cargar el curso: ${errorMessage}`,
				});
			} finally {
				setLoading(false);
			}
		}
	}, [courseIdNumber]);

	useEffect(() => {
		fetchCourse().catch((error) =>
			console.error('Error fetching course:', error)
		);
	}, [fetchCourse]);

	useEffect(() => {
		const savedColor = localStorage.getItem(`selectedColor_${courseIdNumber}`);
		if (savedColor) {
			setSelectedColor(savedColor);
		}
	}, [courseIdNumber]);

	const handleUpdateCourse = async (
		id: string,
		title: string,
		description: string,
		file: File | null,
		categoryid: number,
		modalidadesid: number,
		dificultadid: number,
		requerimientos: string,
		addParametros: boolean, // Nuevo parámetro
		coverImageKey: string,
		fileName: string, // Nuevo parámetro
		rating: number // Añadir esta línea
	) => {
		try {
			let coverImageKey = course?.coverImageKey ?? '';
			let uploadedFileName = fileName ?? '';

			if (file) {
				const uploadResponse = await fetch('/api/upload', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contentType: file.type,
						fileSize: file.size,
						fileName: file.name, // Asegúrate de pasar el fileName correcto
					}),
				});

				if (!uploadResponse.ok) {
					throw new Error('Error al subir la imagen');
				}

				const uploadData = (await uploadResponse.json()) as {
					url: string;
					fields: Record<string, string>;
					key: string;
					fileName: string;
				};

				const { url, fields, key, fileName: responseFileName } = uploadData;
				coverImageKey = key;
				uploadedFileName = responseFileName;

				const formData = new FormData();
				Object.entries(fields).forEach(([key, value]) => {
					if (typeof value === 'string') {
						formData.append(key, value);
					}
				});
				formData.append('file', file);

				const uploadResult = await fetch(url, {
					method: 'POST',
					body: formData,
				});
				if (!uploadResult.ok) {
					throw new Error('Error al subir la imagen al servidor');
				}
			}

			const response = await fetch(
				`/api/educadores/courses/${courseIdNumber}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						title,
						description,
						coverImageKey,
						fileName: uploadedFileName, // Agregar fileName al cuerpo de la solicitud
						categoryid,
						modalidadesid,
						dificultadid,
						instructor: course?.instructor,
						requerimientos,
						rating, // Añadir esta línea
					}),
				}
			);

			if (addParametros) {
				const parametrosPromises = editParametros.map((p) => {
					const existingParametro = parametros.find(
						(param) => param.id === p.id
					);
					const method = existingParametro ? 'PUT' : 'POST';
					const url = existingParametro
						? `/api/educadores/parametros/${existingParametro.id}`
						: '/api/educadores/parametros';

					return fetch(url, {
						method,
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							name: p.name,
							description: p.description,
							porcentaje: p.porcentaje,
							courseId: courseIdNumber,
						}),
					});
				});

				const parametrosResponses = await Promise.all(parametrosPromises);

				for (const responseParametros of parametrosResponses) {
					if (!responseParametros.ok) {
						const errorData = (await responseParametros.json()) as {
							error?: string;
						};
						toast('Error', {
							description:
								errorData.error ?? 'Error al actualizar los parámetros',
						});
						throw new Error(
							errorData.error ?? 'Error al actualizar los parámetros'
						);
					}
				}
			}

			if (!response.ok) {
				const errorData = (await response.json()) as { error?: string };
				toast('Error', {
					description: errorData.error ?? 'Error al actualizar el curso',
				});
				throw new Error(errorData.error ?? 'Error al actualizar el curso');
			}

			const updatedCourse = (await response.json()) as Course;
			setCourse(updatedCourse);

			setIsModalOpen(false);
			toast('Curso actualizado', {
				description: 'El curso se ha actualizado con éxito.',
			});
			if (addParametros) {
				toast('Parámetros actualizados', {
					description: 'Los parámetros se han actualizado con éxito.',
				});
			}
		} catch (error) {
			console.error('Error:', error);
			toast('Error', {
				description:
					error instanceof Error ? error.message : 'Error desconocido',
			});
		}
	};

	const handleEditCourse = () => {
		if (!course) return; // Verificación adicional
		setEditTitle(course.title);
		setEditDescription(course.description);
		setEditRequerimientos(course.requerimientos);
		setEditCategory(parseInt(course.categoryid));
		setEditModalidad(parseInt(course.modalidadesid));
		setEditDificultad(parseInt(course.dificultadid));
		setEditCoverImageKey(course.coverImageKey);
		setEditParametros(
			parametros.map((parametro) => ({
				id: parametro.id,
				name: parametro.name,
				description: parametro.description,
				porcentaje: parametro.porcentaje,
			}))
		);
		setEditRating(course.rating); // Añadir esta línea
		setIsModalOpen(true);
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

	if (!course) return <div>No se encontró el curso.</div>;

	const handleDelete = async (id: number) => {
		try {
			// Primero intentamos eliminar la imagen de S3
			if (course.coverImageKey) {
				const responseAws = await fetch('/api/upload', {
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						key: course.coverImageKey,
					}),
				});

				if (!responseAws.ok) {
					console.error('Error al eliminar la imagen de S3');
				}
			}

			// Luego eliminamos el curso
			const response = await fetch(`/api/educadores/courses?courseId=${id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error(`Error al eliminar el curso, con id: ${id}`);
			}

			toast('Curso eliminado', {
				description: 'El curso se ha eliminado con éxito.',
			});
			router.push('/dashboard/educadores/cursos');
		} catch (error) {
			console.error('Error:', error);
			toast('Error', {
				description: 'No se pudo eliminar el curso completamente',
			});
		}
	};

	if (error) {
		return (
			<main className="flex h-screen items-center justify-center">
				<div className="text-center">
					<p className="text-lg font-semibold text-red-500">
						Error tipo: {error}
					</p>
					<button
						onClick={fetchCourse}
						className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
					>
						Reintentar
					</button>
				</div>
			</main>
		);
	}

	const handlePredefinedColorChange = (color: string) => {
		setSelectedColor(color);
		localStorage.setItem(`selectedColor_${courseIdNumber}`, color);
	};

	return (
		<div className="h-auto w-full rounded-lg bg-background">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary hover:text-gray-300"
							href="/dashboard/educadores"
						>
							Inicio
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary hover:text-gray-300"
							href="/dashboard/educadores/cursos"
						>
							Lista de cursos
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink className="text-primary hover:text-gray-300">
							Detalles del curso
						</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<div className="group relative h-auto w-full">
				<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-linear-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur-sm transition duration-500 group-hover:opacity-100"></div>
				<Card
					className={`relative mt-3 h-auto overflow-hidden border-none bg-black p-6 text-white transition-transform duration-300 ease-in-out zoom-in`}
					style={{
						backgroundColor: selectedColor,
						color: getContrastYIQ(selectedColor),
					}}
				>
					<CardHeader className="grid w-full grid-cols-2 justify-evenly md:gap-32 lg:gap-60">
						<CardTitle className={`text-2xl font-bold text-primary`}>
							Curso: {course.title}
						</CardTitle>
						<div className="ml-9 flex flex-col">
							<Label
								className={
									selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
								}
							>
								Seleccione el color deseado
							</Label>
							<div className="mt-2 flex space-x-2">
								{predefinedColors.map((color) => (
									<Button
										key={color}
										style={{ backgroundColor: color }}
										className={`size-8 border ${selectedColor === '#FFFFFF' ? 'border-black' : 'border-white'} `}
										onClick={() => handlePredefinedColorChange(color)}
									/>
								))}
							</div>
						</div>
					</CardHeader>
					<div className={`grid gap-6 md:grid-cols-2`}>
						{/* Columna izquierda - Imagen */}
						<div className="flex w-full flex-col">
							<div className="relative aspect-video w-full">
								<Image
									src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
									alt={course.title}
									width={300}
									height={100}
									className="mx-auto rounded-lg object-contain"
									priority
									quality={75}
								/>
							</div>
							<div className="mt-8 grid grid-cols-4 gap-5">
								<Button
									className={`border-transparent bg-green-400 text-white hover:bg-green-500`}
								>
									<Link href={`./${course.id}/ver/${course.id}`}>
										Visualizar curso
									</Link>
								</Button>
								<Button
									onClick={handleEditCourse}
									className={`border-yellow-500 bg-yellow-500 text-white hover:bg-yellow-600`}
								>
									Editar curso
								</Button>
								<Button className="border-primary bg-primary text-white hover:bg-primary/90">
									<Link
										href={`/dashboard/educadores/detailsDashboard/${course.id}`}
									>
										Estadisticas
									</Link>
								</Button>
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button variant="destructive">Eliminar</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
											<AlertDialogDescription>
												Esta acción no se puede deshacer. Se eliminará
												permanentemente el curso
												<span className="font-bold"> {course.title}</span> y
												todos los datos asociados a este.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancelar</AlertDialogCancel>
											<AlertDialogAction
												onClick={() => handleDelete(course.id)}
												className="border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-transparent hover:text-red-700"
											>
												Eliminar
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</div>
						{/* Columna derecha - Información */}
						<div className="pb-6">
							<h2 className={`text-2xl font-bold text-primary`}>
								Información del curso
							</h2>
							<br />
							<div className="grid grid-cols-2">
								<div className="flex flex-col">
									<h2
										className={`text-lg font-semibold ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Curso:
									</h2>
									<h1 className={`mb-4 text-2xl font-bold text-primary`}>
										{course.title}
									</h1>
								</div>
								<div className="flex flex-col">
									<h2
										className={`text-lg font-semibold ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Categoría:
									</h2>
									<Badge
										variant="outline"
										className="ml-1 w-fit border-primary bg-background text-primary hover:bg-black/70"
									>
										{course.categoryid}
									</Badge>
								</div>
							</div>
							<div className="mb-4">
								<h2
									className={`text-lg font-semibold ${
										selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
									}`}
								>
									Descripción:
								</h2>
								<p
									className={`text-justify ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'}`}
								>
									{course.description}
								</p>
							</div>
							<div className="grid grid-cols-3">
								<div className="flex flex-col">
									<h2
										className={`text-lg font-semibold ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Educador:
									</h2>
									<Badge
										variant="outline"
										className="ml-1 w-fit border-primary bg-background text-primary hover:bg-black/70"
									>
										{course.instructor}
									</Badge>
								</div>
								<div className="flex flex-col">
									<h2
										className={`text-lg font-semibold ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Dificultad:
									</h2>
									<Badge
										variant="outline"
										className="ml-1 w-fit border-primary bg-background text-primary hover:bg-black/70"
									>
										{course.dificultadid}
									</Badge>
								</div>
								<div className="flex flex-col">
									<h2
										className={`text-lg font-semibold ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Modalidad:
									</h2>
									<Badge
										variant="outline"
										className="ml-1 w-fit border-primary bg-background text-primary hover:bg-black/70"
									>
										{course.modalidadesid}
									</Badge>
								</div>
							</div>
						</div>
					</div>
				</Card>
			</div>
			{loading ? (
				<LoadingCourses />
			) : (
				courseIdNumber !== null && (
					<>
						<LessonsListEducator
							courseId={courseIdNumber}
							selectedColor={selectedColor}
						/>
					</>
				)
			)}
			<DashboardEstudiantes
				courseId={courseIdNumber}
				selectedColor={selectedColor}
			/>
			<ModalFormCourse
				isOpen={isModalOpen}
				onSubmitAction={(
					id: string,
					title: string,
					description: string,
					file: File | null,
					categoryid: number,
					modalidadesid: number,
					dificultadid: number,
					rating: number, // Añadir esta línea
					requerimientos: string,
					addParametros: boolean, // Nuevo parámetro
					coverImageKey: string,
					fileName: string // Nuevo parámetro
				) =>
					handleUpdateCourse(
						id,
						title,
						description,
						file,
						categoryid,
						modalidadesid,
						dificultadid,
						requerimientos,
						addParametros, // Pasar el nuevo parámetro
						coverImageKey,
						fileName, // Pasar el nuevo parámetro
						rating // Añadir esta línea
					)
				}
				editingCourseId={course.id}
				title={editTitle}
				description={editDescription}
				requerimientos={editRequerimientos}
				categoryid={editCategory}
				modalidadesid={editModalidad}
				dificultadid={editDificultad}
				coverImageKey={editCoverImageKey}
				parametros={editParametros}
				rating={editRating} // Añadir esta línea
				setTitle={setEditTitle}
				setDescription={setEditDescription}
				setRequerimientos={setEditRequerimientos}
				setModalidadesid={setEditModalidad}
				setCategoryid={setEditCategory}
				setDificultadid={setEditDificultad}
				setCoverImageKey={setEditCoverImageKey}
				setParametrosAction={(
					parametros: {
						id: number;
						name: string;
						description: string;
						porcentaje: number;
					}[]
				) => setEditParametros(parametros)}
				setRating={setEditRating} // Añadir esta línea
				onCloseAction={() => setIsModalOpen(false)}
				uploading={false} // Añadir esta línea
			/>
		</div>
	);
};

export default CourseDetail;
