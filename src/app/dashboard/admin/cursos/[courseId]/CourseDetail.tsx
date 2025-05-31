'use client';
import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { Portal } from '@radix-ui/react-portal';
import { toast } from 'sonner';

import { LoadingCourses } from '~/app/dashboard/educadores/(inicio)/cursos/page';
import DashboardEstudiantes from '~/components/educators/layout/DashboardEstudiantes';
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
import { Button } from '~/components/educators/ui/button';
import { Card, CardHeader, CardTitle } from '~/components/educators/ui/card';
import { Label } from '~/components/educators/ui/label';
import TechLoader from '~/components/estudiantes/ui/tech-loader';
import LessonsListEducator from '~/components/super-admin/layout/LessonsListEducator'; // Importar el componente
import ModalFormCourse from '~/components/super-admin/modals/ModalFormCourse';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/super-admin/ui/breadcrumb';

// Definir la interfaz del curso
interface Course {
	id: number;
	title: string;
	description: string;
	categoryid: string;
	nivelid: string; // Replaced  with nivelid
	modalidadesid: string;
	instructor: string;
	coverImageKey: string;
	creatorId: string;
	createdAt: string;
	updatedAt: string;
	rating: number;
	courseTypeId?: number | null; // ✅ Agrega esto
	courseTypeName?: string;
	isActive: boolean;
	instructorName: string;
	coverVideoCourseKey?: string;
}
interface Materia {
	id: number;
	title: string;
}

// Definir la interfaz de las propiedades del componente
interface CourseDetailProps {
	courseId: number;
}

// Definir la interfaz de los parámetros
export interface Parametros {
	id: number;
	name: string;
	description: string;
	porcentaje: number;
	courseId: number;
}

// Add these interfaces after the existing interfaces
interface Educator {
	id: string;
	name: string;
}

// Función para obtener el contraste de un color
const getContrastYIQ = (hexcolor: string) => {
	if (hexcolor === '#FFFFFF') return 'black'; // Manejar el caso del color blanco
	hexcolor = hexcolor.replace('#', '');
	const r = parseInt(hexcolor.substr(0, 2), 16);
	const g = parseInt(hexcolor.substr(2, 2), 16);
	const b = parseInt(hexcolor.substr(4, 2), 16);
	const yiq = (r * 299 + g * 587 + b * 114) / 1000;
	return yiq >= 128 ? 'black' : 'white';
};

// Add this CSS block at the top of the file after imports:
const styles = `
  .svg-frame {
    position: relative;
    width: 300px;
    height: 300px;
    transform-style: preserve-3d;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .svg-frame svg {
    position: absolute;
    transition: .5s;
    z-index: calc(1 - (0.2 * var(--j)));
    transform-origin: center;
    width: 344px;
    height: 344px;
    fill: none;
  }

  .svg-frame:hover svg {
    transform: rotate(-80deg) skew(30deg) translateX(calc(45px * var(--i))) translateY(calc(-35px * var(--i)));
  }

  #out2 {
    animation: rotate16 7s ease-in-out infinite alternate;
    transform-origin: center;
  }

  #out3 {
    animation: rotate16 3s ease-in-out infinite alternate;
    transform-origin: center;
    stroke: #ff0;
  }

  @keyframes rotate16 {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Replace the stylesheet append code
if (typeof document !== 'undefined') {
	const styleSheet = document.createElement('style');
	styleSheet.textContent = styles;
	document.head.appendChild(styleSheet);
}

// Replace the FullscreenLoader component with:
const FullscreenLoader = () => {
	return (
		<Portal>
			<div className="bg-background/20 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
				<TechLoader />
			</div>
		</Portal>
	);
};

const CourseDetail: React.FC<CourseDetailProps> = () => {
	const router = useRouter(); // Obtener el router
	const params = useParams(); // Obtener los parámetros
	const courseIdUrl = params?.courseId; // Obtener el id del curso desde params
	const [course, setCourse] = useState<Course | null>(null); // Nuevo estado para el curso
	const [parametros, setParametros] = useState<Parametros[]>([]); // Nuevo estado para los parámetros
	const [isModalOpen, setIsModalOpen] = useState(false); // Nuevo estado para el modal de edición
	const [editTitle, setEditTitle] = useState(''); // Nuevo estado para el título del curso a editar
	const [editDescription, setEditDescription] = useState(''); // Nuevo estado para la descripción del curso
	const [editCategory, setEditCategory] = useState(0); // Nuevo estado para la categoría del curso
	const [editModalidad, setEditModalidad] = useState(0); // Nuevo estado para la modalidad del curso
	const [editNivel, setEditNivel] = useState(0); // Replaced  with editNivel
	const [editCoverImageKey, setEditCoverImageKey] = useState(''); // Nuevo estado para la imagen del curso
	const [loading, setLoading] = useState(true); // Nuevo estado para el estado de carga de la página
	const [error, setError] = useState<string | null>(null); // Nuevo estado para los errores
	const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF'); // Color predeterminado blanco
	const predefinedColors = ['#1f2937', '#000000', '#FFFFFF']; // Colores específicos
	const [materias, setMaterias] = useState<Materia[]>([]);
	const [courseTypeId, setCourseTypeId] = useState<number | null>(null);

	const BADGE_GRADIENTS = [
		'from-pink-500 via-red-500 to-yellow-500',
		'from-green-300 via-blue-500 to-purple-600',
		'from-pink-300 via-purple-300 to-indigo-400',
		'from-yellow-400 via-pink-500 to-red-500',
		'from-blue-400 via-indigo-500 to-purple-600',
		'from-green-400 via-cyan-500 to-blue-500',
		'from-orange-400 via-pink-500 to-red-500',
	];

	type BadgeGradientFunction = () => string;

	const getBadgeGradient: BadgeGradientFunction = () => {
		return BADGE_GRADIENTS[Math.floor(Math.random() * BADGE_GRADIENTS.length)];
	};

	const [isActive, setIsActive] = useState<boolean>(true);

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
		: courseIdUrl; // Obtener el id del curso como string
	const courseIdString2 = courseIdString ?? ''; // Verificar si el id del curso es nulo
	const courseIdNumber = parseInt(courseIdString2); // Convertir el id del curso a número

	// Add these new states after the existing states
	const [educators, setEducators] = useState<Educator[]>([]);
	const [selectedInstructor, setSelectedInstructor] = useState<string>('');
	const [isUpdating, setIsUpdating] = useState(false);
	const [currentInstructor, setCurrentInstructor] = useState('');
	const [editCoverVideoCourseKey, setEditCoverVideoCourseKey] = useState<string | null>(null);


	// Agregar este nuevo estado
	const [currentSubjects, setCurrentSubjects] = useState<{ id: number }[]>([]);

	// Función para obtener el curso y los parámetros
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
				const materiasResponse = await fetch(
					`/api/educadores/courses/${courseIdNumber}/materiasOne`
				);
				if (materiasResponse.ok) {
					const materiasData = (await materiasResponse.json()) as Materia[];
					setMaterias(materiasData);
				} else {
					console.log(
						'No se encontraron materias o no se pudo cargar la información de las materias.'
					);
				}

				if (!response.ok || !responseParametros.ok) {
					throw new Error(response.statusText);
				}
				if (response.ok && responseParametros.ok) {
					const data = (await response.json()) as Course;
					setCourse(data);
					setCourseTypeId(data.courseTypeId ?? null);
					setCurrentInstructor(data.instructor); // Set current instructor when course loads
					setSelectedInstructor(data.instructor); // Set selected instructor when course loads
					setEditCoverVideoCourseKey(data.coverVideoCourseKey ?? null); // 🔧 <-- agregamos esto


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

	// Add this function after fetchCourse
	const fetchEducators = async () => {
		try {
			const response = await fetch('/api/super-admin/changeEducators');
			if (!response.ok) throw new Error('Failed to fetch educators');
			const data = (await response.json()) as Educator[];
			setEducators(data);
		} catch (error) {
			console.error('Error fetching educators:', error);
		}
	};

	// Obtener el curso y los parámetros al cargar la página
	useEffect(() => {
		void fetchCourse();
	}, [fetchCourse]);

	// Add this useEffect after the existing useEffects
	useEffect(() => {
		void fetchEducators(); // Use void operator to explicitly ignore the promise
	}, []);

	// Obtener el color seleccionado al cargar la página
	useEffect(() => {
		const savedColor = localStorage.getItem(`selectedColor_${courseIdNumber}`);
		if (savedColor) {
			setSelectedColor(savedColor);
		}
	}, [courseIdNumber]);

	// Manejo de actualizar
	const handleUpdateCourse = async (
		_id: string,
		title: string,
		description: string,
		file: File | null,
		categoryid: number,
		modalidadesid: number,
		nivelid: number,
		addParametros: boolean,
		_coverImageKey: string,
		fileName: string,
		rating: number,
		courseTypeId: number | null,
		_isActive: boolean,
		subjects: { id: number }[]
	) => {
		try {
			setIsUpdating(true); // Agregar indicador de carga
			let coverImageKey = course?.coverImageKey ?? '';
			let uploadedFileName = fileName ?? '';

			if (file) {
				// Subir la imagen a S3
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

			// Primero actualizar el curso
			const response = await fetch(
				`/api/educadores/courses/${courseIdNumber}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						title,
						description,
						coverImageKey,
						fileName: uploadedFileName,
						categoryid,
						modalidadesid,
						nivelid,
						instructor: currentInstructor, // Enviar el ID del instructor
						rating,
						courseTypeId,
						isActive,
						subjects: subjects || currentSubjects,
					}),
				}
			);

			if (!response.ok) {
				throw new Error('Error al actualizar el curso');
			}

			// Si hay parámetros, actualizar
			if (addParametros) {
				try {
					// 1. Primero eliminar todos los parámetros existentes
					for (const parametro of editParametros) {
						if (parametro.id) {
							// Tiene ID → es un parámetro existente → actualizar
							await fetch('/api/educadores/parametros', {
								method: 'PUT',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									parametros: [
										{
											id: parametro.id,
											name: parametro.name,
											description: parametro.description,
											porcentaje: parametro.porcentaje,
											courseId: courseIdNumber,
										},
									],
								}),
							});
						} else {
							// No tiene ID → es nuevo → crear
							await fetch('/api/educadores/parametros', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									name: parametro.name,
									description: parametro.description,
									porcentaje: parametro.porcentaje,
									courseId: courseIdNumber,
								}),
							});
						}
					}

					toast.success('Parámetros actualizados correctamente');
				} catch (error) {
					toast.error('Error al actualizar los parámetros');
					console.error('Error con los parámetros:', error);
				}
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

			await fetchCourse(); // Recargar los datos del curso después de actualizar
		} catch (error) {
			console.error('Error:', error);
			toast.error('Error al actualizar el curso');
		} finally {
			setIsUpdating(false); // Asegurarse de que el indicador de carga se apague
		}
	};

	// Función para manejar la edición del curso
	const handleEditCourse = () => {
		if (!course) return;
		setEditTitle(course.title);
		setEditDescription(course.description);
		setEditCategory(parseInt(course.categoryid));
		setEditModalidad(parseInt(course.modalidadesid));
		setEditNivel(parseInt(course.nivelid)); // Asegúrate de convertir a número
		setEditCoverImageKey(course.coverImageKey);
		setEditParametros(
			parametros.map((parametro) => ({
				id: parametro.id,
				name: parametro.name,
				description: parametro.description,
				porcentaje: parametro.porcentaje,
			}))
		);
		setEditRating(course.rating);
		setCourseTypeId(course.courseTypeId ?? null);
		setIsActive(course.isActive ?? true);
		setCurrentInstructor(course.instructor);
		setCurrentSubjects(materias.map((materia) => ({ id: materia.id })));
		setIsModalOpen(true);
	};

	// Verificar si se está cargando
	if (loading) {
		return (
			<main className="flex h-screen flex-col items-center justify-center">
				<div className="border-primary size-32 rounded-full border-y-2">
					<span className="sr-only" />
				</div>
				<span className="text-primary">Cargando...</span>
			</main>
		);
	}

	// Verificar si hay un error o hay curso
	if (!course) return <div>No se encontró el curso.</div>;

	// Función para manejar la eliminación del curso
	const handleDelete = async () => {
		if (!course) return;
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
			const response = await fetch(
				`/api/educadores/courses?courseId=${course.id}`,
				{
					method: 'DELETE',
				}
			);

			if (!response.ok) {
				throw new Error(`Error al eliminar el curso`);
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

	// Verificar si hay un error
	if (error) {
		return (
			<main className="flex h-screen items-center justify-center">
				<div className="text-center">
					<p className="text-lg font-semibold text-red-500">
						Error tipo: {error}
					</p>
					<button
						onClick={fetchCourse}
						className="bg-primary mt-4 rounded-md px-4 py-2 text-white"
					>
						Reintentar
					</button>
				</div>
			</main>
		);
	}

	// Función para manejar el cambio de color predefinido
	const handlePredefinedColorChange = (color: string) => {
		setSelectedColor(color);
		localStorage.setItem(`selectedColor_${courseIdNumber}`, color);
	};

	// Modify handleChangeInstructor to include name
	const handleChangeInstructor = async () => {
		if (!selectedInstructor || !course?.id) {
			toast.error('Por favor seleccione un instructor');
			return;
		}

		try {
			setIsUpdating(true);

			const response = await fetch('/api/super-admin/changeEducators', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					courseId: course.id,
					newInstructor: selectedInstructor,
				}),
			});

			if (!response.ok) {
				throw new Error('Error al actualizar el instructor');
			}

			// Update the course state with new instructor
			const selectedEducator = educators.find(
				(e) => e.id === selectedInstructor
			);

			if (selectedEducator && course) {
				setCourse({
					...course,
					instructor: selectedInstructor,
					instructorName: selectedEducator.name,
				});

				setSelectedInstructor('');
				toast.success('Instructor actualizado exitosamente');
				await fetchCourse();
			}
		} catch (error) {
			console.error('Error:', error);
			toast.error('Error al actualizar el instructor');
		} finally {
			setIsUpdating(false);
		}
	};

	// Add this before the return statement
	if (isUpdating) {
		return <FullscreenLoader />;
	}

	// Renderizar el componente
	return (
		<div className="bg-background h-auto w-full rounded-lg p-4">
			<Breadcrumb className="mb-4">
				<BreadcrumbList className="flex flex-wrap gap-2">
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary hover:text-gray-300"
							href="/dashboard/super-admin"
						>
							Inicio
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary hover:text-gray-300"
							href="/dashboard/super-admin/cursos"
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
				<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-linear-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur-sm transition duration-500 group-hover:opacity-100" />
				<Card
					className={`zoom-in relative mt-3 h-auto overflow-hidden border-none p-4 transition-transform duration-300 ease-in-out sm:p-6`}
					style={{
						backgroundColor: selectedColor,
						color: getContrastYIQ(selectedColor),
					}}
				>
					<CardHeader className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 lg:gap-16">
						<CardTitle className="text-primary text-xl font-bold sm:text-2xl">
							Curso: {course.title}
						</CardTitle>
						<div className="flex flex-col">
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
										className={`size-8 border ${
											selectedColor === '#FFFFFF'
												? 'border-black'
												: 'border-white'
										} `}
										onClick={() => handlePredefinedColorChange(color)}
									/>
								))}
							</div>
						</div>
					</CardHeader>
					<div className="grid gap-6 md:grid-cols-2">
						{/* Left Column - Image */}
						<div className="flex w-full flex-col space-y-4">
							<div className="relative aspect-video w-full">
								<Image
									src={`${process.env.NEXT_PUBLIC_AWS_S3_URL ?? ''}/${course.coverImageKey}`}
									alt={course.title}
									width={300}
									height={100}
									className="mx-auto rounded-lg object-contain"
									priority
									quality={75}
								/>
							</div>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
								<Button className="w-full bg-green-400 text-white hover:bg-green-500 sm:w-auto">
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
								<Button className="border-primary bg-primary hover:bg-primary/90 text-white">
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
												onClick={() => handleDelete()}
												className="border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-transparent hover:text-red-700"
											>
												Eliminar
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</div>
						{/* Right Column - Information */}
						<div className="space-y-6">
							<h2 className="text-primary text-xl font-bold sm:text-2xl">
								Información del curso
							</h2>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<h2
										className={`text-base font-semibold sm:text-lg ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Curso:
									</h2>
									<h1 className="text-primary text-xl font-bold sm:text-2xl">
										{course.title}
									</h1>
								</div>
								<div className="space-y-2">
									<h2
										className={`text-base font-semibold sm:text-lg ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Categoría:
									</h2>
									<Badge
										variant="outline"
										className="border-primary bg-background text-primary ml-1 w-fit hover:bg-black/70"
									>
										{course.categoryid}
									</Badge>
								</div>
							</div>
							<div className="space-y-2">
								<h2
									className={`text-base font-semibold sm:text-lg ${
										selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
									}`}
								>
									Descripción:
								</h2>
								<p
									className={`text-justify text-sm sm:text-base ${
										selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
									}`}
								>
									{course.description}
								</p>
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
								<div className="space-y-2">
									<h2
										className={`text-base font-semibold sm:text-lg ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Educador:
									</h2>
									<div className="flex flex-col gap-2">
										<select
											value={selectedInstructor || course.instructor} // Use current instructor as fallback
											onChange={(e) => setSelectedInstructor(e.target.value)}
											className="border-primary bg-background text-primary w-full rounded-md border p-2 text-sm"
										>
											<option value={course.instructor}>
												{course.instructorName ??
													educators.find((e) => e.id === course.instructor)
														?.name ??
													'Sin nombre'}
											</option>
											{educators
												.filter((ed) => ed.id !== course.instructor)
												.map((educator) => (
													<option key={educator.id} value={educator.id}>
														{educator.name}
													</option>
												))}
										</select>

										{selectedInstructor &&
											selectedInstructor !== course.instructor && (
												<Button
													variant="outline"
													size="sm"
													onClick={handleChangeInstructor}
													className="border-primary text-primary hover:bg-primary relative w-full hover:text-white"
													disabled={isUpdating}
												>
													Guardar cambio
												</Button>
											)}
									</div>
								</div>
								<div className="space-y-2">
									<h2
										className={`text-base font-semibold sm:text-lg ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Nivel:
									</h2>
									<Badge
										variant="outline"
										className="border-primary bg-background text-primary ml-1 w-fit hover:bg-black/70"
									>
										{course.nivelid}
									</Badge>
								</div>
								<div className="space-y-2">
									<h2
										className={`text-base font-semibold sm:text-lg ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Modalidad:
									</h2>
									<Badge
										variant="outline"
										className="border-primary bg-background text-primary ml-1 w-fit hover:bg-black/70"
									>
										{course.modalidadesid}
									</Badge>
								</div>
								<div className="space-y-2">
									<h2
										className={`text-base font-semibold sm:text-lg ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Tipo de curso:
									</h2>
									<Badge
										variant="outline"
										className="border-primary bg-background text-primary ml-1 w-fit hover:bg-black/70"
									>
										{course.courseTypeName ?? 'No especificado'}
									</Badge>
								</div>
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
								<div className="space-y-2">
									<h2
										className={`text-base font-semibold sm:text-lg ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Estado:
									</h2>
									<Badge
										variant="outline"
										className={`ml-1 w-fit border ${
											course.isActive
												? 'border-green-500 text-green-500'
												: 'border-red-500 text-red-500'
										} bg-background hover:bg-black/70`}
									>
										{course.isActive ? 'Activo' : 'Inactivo'}
									</Badge>
								</div>
								<div className="materias-container col-span-1 sm:col-span-2">
									<h3 className="mb-2 text-base font-semibold sm:text-lg">
										Materias:
									</h3>
									{materias.length > 0 ? (
										<div className="flex flex-wrap gap-2">
											{[
												...new Map(materias.map((m) => [m.title, m])).values(),
											].map((materia) => (
												<Badge
													key={materia.id}
													variant="secondary"
													className={`bg-gradient-to-r ${getBadgeGradient()} text-white transition-all duration-300 hover:scale-105 hover:shadow-lg`}
												>
													{materia.title}
												</Badge>
											))}
										</div>
									) : (
										<p>No hay materias asociadas a este curso.</p>
									)}
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
					id,
					title,
					description,
					file,
					categoryid,
					modalidadesid,
					nivelid,
					rating,
					addParametros,
					coverImageKey,
					fileName,
					courseTypeId,
					isActive,
					subjects
				) =>
					handleUpdateCourse(
						id,
						title,
						description,
						file,
						categoryid,
						modalidadesid,
						nivelid,
						addParametros,
						coverImageKey,
						fileName,
						rating,
						courseTypeId,
						isActive,
						subjects
					)
				}
				editingCourseId={course.id}
				title={editTitle}
				description={editDescription}
				categoryid={editCategory}
				modalidadesid={editModalidad}
				nivelid={editNivel} // Replaced id with nivelid
				coverImageKey={editCoverImageKey}
				parametros={editParametros}
				rating={editRating} // Añadir esta línea
				setTitle={setEditTitle}
				setDescription={setEditDescription}
				setModalidadesid={(value: number | number[]) =>
					setEditModalidad(
						Array.isArray(value) ? Number(value[0]) : Number(value)
					)
				}
				setCategoryid={setEditCategory}
				setNivelid={setEditNivel} // Replaced setid with setNivelid
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
				courseTypeId={courseTypeId} // usa el estado que ya tienes
				setCourseTypeId={setCourseTypeId}
				isActive={isActive}
				setIsActive={setIsActive}
				instructor={currentInstructor}
				setInstructor={setCurrentInstructor}
				educators={educators}
				subjects={currentSubjects}
				setSubjects={setCurrentSubjects}
				coverVideoCourseKey={editCoverVideoCourseKey}
				setCoverVideoCourseKey={setEditCoverVideoCourseKey}
			/>
		</div>
	);
};

export default CourseDetail;
