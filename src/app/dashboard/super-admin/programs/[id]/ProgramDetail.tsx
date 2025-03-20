'use client';

import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs'; // 🔥 Agrega esta línea al inicio del archivo
import { toast } from 'sonner';

import ModalFormCourse from '~/components/educators/modals/program/ModalFormCourse'; // Import ModalFormCourse
import { Badge } from '~/components/estudiantes/ui/badge';
import { Button } from '~/components/estudiantes/ui/button';
import { Card, CardHeader, CardTitle } from '~/components/estudiantes/ui/card';
import { Label } from '~/components/estudiantes/ui/label';
import ProgramCoursesList from '~/components/super-admin/layout/programdetail/ProgramCoursesList';
import { type CourseData as BaseCourseData } from '~/server/queries/queries';

interface CourseData extends BaseCourseData {
	programId?: number; // Add programId as an optional property
}

// Definir la interfaz del programa
interface Program {
	id: number;
	title: string;
	description: string;
	categoryid: string;
	nivelid: string;
	modalidadesid: string;
	instructor: string;
	coverImageKey: string;
	creatorId: string;
	createdAt: string;
	updatedAt: string;
	rating: number;
}

export interface CourseModel {
	id: number;
	title: string;
	description: string;
	categoryid: string;
	modalidadesid: string;
	createdAt: string;
	instructor: string;
	coverImageKey: string;
	creatorId: string;
	nivelid: string;
	totalParametros: number;
	rating: number;
}

// Definir la interfaz de las propiedades del componente
interface ProgramDetailProps {
	programId: number;
}

// Definir la interfaz de los parámetros
export interface Parametros {
	id: number;
	name: string;
	description: string;
	porcentaje: number;
	programId: number;
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

const ProgramDetail: React.FC<ProgramDetailProps> = () => {
	const router = useRouter(); // Obtener el router
	const params = useParams(); // Obtener los parámetros
	const programIdUrl = params?.id; // Obtener el id del programa desde params
	const [program, setProgram] = useState<Program | null>(null); // Nuevo estado para el programa
	const [parametros, setParametros] = useState<Parametros[]>([]); // Nuevo estado para los parámetros
	const [isModalOpen, setIsModalOpen] = useState(false); // Nuevo estado para el modal de edición
	const [editTitle, setEditTitle] = useState(''); // Nuevo estado para el título del programa a editar
	const [editDescription, setEditDescription] = useState(''); // Nuevo estado para la descripción del programa
	const [editCategory, setEditCategory] = useState(0); // Nuevo estado para la categoría del programa
	const [editModalidad, setEditModalidad] = useState(0); // Nuevo estado para la modalidad del programa
	const [editNivel, setEditNivel] = useState(0); // Nuevo estado para la nivel del programa
	const [editCoverImageKey, setEditCoverImageKey] = useState(''); // Nuevo estado para la imagen del programa
	const [loading, setLoading] = useState(true); // Nuevo estado para el estado de carga de la página
	const [error, setError] = useState<string | null>(null); // Nuevo estado para los errores
	const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF'); // Color predeterminado blanco
	const predefinedColors = ['#000000', '#FFFFFF', '#1f2937']; // Colores específicosconst { user } = useUser(); // 🔥 Agrega esta línea en el componente
	const { user } = useUser(); // 🔥 Agrega esta línea en el componente
	const [uploading, setUploading] = useState(false); // Nuevo estado para la carga

	const [editParametros, setEditParametros] = useState<
		{
			id: number;
			name: string;
			description: string;
			porcentaje: number;
		}[]
	>([]); // Nuevo estado para los parámetros
	const [editRating, setEditRating] = useState(0); // Añadir esta línea
	const [courses, setCourses] = useState<CourseData[]>([]); // Nuevo estado para los cursos
	const [isCourseModalOpen, setIsCourseModalOpen] = useState(false); // State for course modal
	const [subjects, setSubjects] = useState<
		{ id: number; courseId?: number | null }[]
	>([]);

	const programIdString = Array.isArray(programIdUrl)
		? programIdUrl[0]
		: programIdUrl; // Obtener el id del programa como string
	const programIdString2 = programIdString ?? ''; // Verificar si el id del programa es nulo
	const programIdNumber = parseInt(programIdString2); // Convertir el id del programa a número
	const [editingCourse, setEditingCourse] = useState<CourseModel | null>(null); // interfaz de cursos

	const [newCourse, setNewCourse] = useState<CourseData>({
		id: 0,
		title: '',
		description: '',
		categoryid: 0,
		modalidadesid: 0,
		nivelid: 0,
		instructor: '',
		coverImageKey: '',
		creatorId: '',
		rating: 0,
		createdAt: new Date().toISOString(),
	});
	// Función para obtener el programa y los parámetros
	const fetchProgram = useCallback(async () => {
		if (programIdNumber !== null) {
			try {
				const response = await fetch(
					`/api/super-admin/programs/${programIdNumber}`
				);
				if (!response.ok) {
					throw new Error('Error fetching program');
				}
				const data = (await response.json()) as Program;
				const coursesResponse = await fetch(
					`/api/super-admin/programs/${programIdNumber}/courses`
				);
				if (!coursesResponse.ok) {
					throw new Error('Error fetching courses');
				}
				const coursesData = (await coursesResponse.json()) as CourseData[];
				setCourses(coursesData);

				setProgram(data);
				setLoading(false);
			} catch (error) {
				console.error('Error fetching program:', error);
				setError('Error fetching program');
				setLoading(false);
			}
		}
	}, [programIdNumber]);

	// Obtener el programa y los parámetros al cargar la página
	useEffect(() => {
		fetchProgram().catch((error) =>
			console.error('Error fetching program:', error)
		);
	}, [fetchProgram]);

	// Obtener el color seleccionado al cargar la página
	useEffect(() => {
		const savedColor = localStorage.getItem(`selectedColor_${programIdNumber}`);
		if (savedColor) {
			setSelectedColor(savedColor);
		}
	}, [programIdNumber]);

	// Manejo de actualizar
	const handleUpdateProgram = async (
		id: string,
		title: string,
		description: string,
		file: File | null,
		categoryid: number,
		modalidadesid: number,
		nivelid: number,
		addParametros: boolean,
		coverImageKey: string,
		fileName: string,
		rating: number
	) => {
		try {
			const coverImageKey = program?.coverImageKey ?? '';
			const uploadedFileName = fileName ?? '';

			if (file) {
				// Handle file upload
			}

			// Actualizar el programa
			const response = await fetch(
				`/api/super-admin/programs/${programIdNumber}`,
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
						instructor: program?.instructor,
						rating,
					}),
				}
			);

			// añadir parametros a la actualización si es true
			if (addParametros) {
				// Handle adding parameters
			}

			if (!response.ok) {
				throw new Error('Error updating program');
			}

			const updatedProgram = (await response.json()) as Program;
			setProgram(updatedProgram);

			setIsModalOpen(false);
			toast('Programa Actualizado', {
				description: 'El Programa Se Ha Actualizado Con Éxito.',
			});
			if (addParametros) {
				// Handle adding parameters
			}
		} catch (error) {
			console.error('Error:', error);
			toast('Error', {
				description:
					error instanceof Error ? error.message : 'Error Desconocido',
			});
		}
	};

	// Función para manejar la edición del programa
	const handleEditProgram = () => {
		if (!program) return; // Verificación adicional
		setEditTitle(program.title);
		setEditDescription(program.description);
		setEditCategory(parseInt(program.categoryid));
		setEditModalidad(parseInt(program.modalidadesid));
		setEditNivel(parseInt(program.nivelid));
		setEditCoverImageKey(program.coverImageKey);
		setEditParametros(
			parametros.map((parametro) => ({
				id: parametro.id,
				name: parametro.name,
				description: parametro.description,
				porcentaje: parametro.porcentaje,
			}))
		);
		setEditRating(program.rating); // Añadir esta línea
		setIsModalOpen(true);
	};

	// Verificar si se está cargando
	if (loading) {
		return (
			<main className="flex h-screen flex-col items-center justify-center">
				<div className="size-32 animate-spin rounded-full border-y-2 border-primary">
					<span className="sr-only" />
				</div>
				<span className="text-primary">Cargando...</span>
			</main>
		);
	}

	// Verificar si hay un error o hay programa
	if (!program) return <div>No Se Encontró El Programa.</div>;

	// Función para manejar la eliminación del programa
	const handleDelete = async (id: number) => {
		try {
			const response = await fetch(`/api/super-admin/programs/${id}`, {
				method: 'DELETE',
			});
			if (!response.ok) {
				throw new Error('Error Deleting Program');
			}
			router.push('/dashboard/super-admin/programs');
		} catch (error) {
			console.error('Error Deleting Program:', error);
			toast('Error', {
				description:
					error instanceof Error ? error.message : 'Error Desconocido',
			});
		}
	};

	// Verificar si hay un error
	if (error) {
		return (
			<div className="flex h-screen flex-col items-center justify-center">
				<p className="text-red-500">{error}</p>
			</div>
		);
	}

	// Función para manejar el cambio de color predefinido
	const handlePredefinedColorChange = (color: string) => {
		setSelectedColor(color);
		localStorage.setItem(`selectedColor_${programIdNumber}`, color);
	};

	// Function to handle opening the course modal
	const handleCreateCourse = () => {
		setNewCourse({
			id: 0,
			title: '',
			description: '',
			categoryid: 0,
			modalidadesid: 0,
			nivelid: 0,
			instructor: '',
			programId: programIdNumber, // programId is now part of CourseData
			creatorId: '',
			rating: 0,
			coverImageKey: '', // Add the missing coverImageKey property
			createdAt: new Date().toISOString(),
		});
	
		setEditParametros([]); // 🔥 Resetear los parámetros antes de abrir el modal
		setIsCourseModalOpen(true);
	};
	

	const handleCloseCourseModal = () => {
		setIsCourseModalOpen(false);
		setNewCourse({
			id: 0,
			title: '',
			description: '',
			categoryid: 0,
			modalidadesid: 0,
			nivelid: 0,
			instructor: '',
			coverImageKey: '',
			creatorId: '',
			rating: 0,
			createdAt: new Date().toISOString(), // Add createdAt property
		});
	};

	const handleCreateOrEditCourse = async (
		id: string,
		title: string,
		description: string,
		file: File | null,
		categoryid: number,
		modalidadesid: number[],
		nivelid: number,
		rating: number,
		addParametros: boolean,
		coverImageKey: string,
		fileName: string,
		subjects: { id: number }[]
	) => {
		if (!user) return;
	
		try {
			setUploading(true);
	
			if (file) {
				const uploadResponse = await fetch('/api/upload', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contentType: file.type,
						fileSize: file.size,
						fileName: file.name,
					}),
				});
	
				if (!uploadResponse.ok) {
					throw new Error(`Error: al iniciar la carga: ${uploadResponse.statusText}`);
				}
	
				const uploadData = (await uploadResponse.json()) as {
					url: string;
					fields: Record<string, string>;
					key: string;
					fileName: string;
				};
	
				coverImageKey = uploadData.key;
				fileName = uploadData.fileName;
	
				const formData = new FormData();
				Object.entries(uploadData.fields).forEach(([key, value]) => {
					formData.append(key, value);
				});
				formData.append('file', file);
	
				await fetch(uploadData.url, { method: 'POST', body: formData });
			}
	
			const response = await fetch('/api/educadores/courses/cursoMateria', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					description,
					coverImageKey,
					fileName,
					categoryid,
					modalidadesid,
					instructor: user.fullName,
					creatorId: user.id,
					nivelid,
					rating,
					subjects,
				}),
			});
	
			if (response.ok) {
				const responseData = (await response.json()) as { id: number }[];
				console.log('📌 Respuesta de la API al crear curso:', responseData);
	
				responseData.forEach(async (data) => {
					console.log(`Curso creado con ID: ${data.id}`);  // Log each created course ID
	
					// If addParametros is true, assign parameters for each course
					if (addParametros) {
						for (const parametro of editParametros) {
							try {
								const paramResponse = await fetch('/api/educadores/parametros', {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({
										name: parametro.name,
										description: parametro.description,
										porcentaje: parametro.porcentaje,
										courseId: data.id,
									}),
								});
	
								if (!paramResponse.ok) {
									const errorData = (await paramResponse.json()) as { error: string };
									throw new Error(errorData.error);
								}
	
								toast.success('Parámetro creado exitosamente', {
									description: `El parámetro se ha creado exitosamente para el curso ID ${data.id}`,
								});
							} catch (error) {
								toast.error('Error al crear el parámetro', {
									description: `Error al crear el parámetro para el curso ID ${data.id}: ${(error as Error).message}`,
								});
							}
						}
					}
	
					
				});
	
				toast.success('Curso(s) creado(s) con éxito', {
					description: `Curso(s) creado(s) exitosamente con ID(s): ${responseData.map(r => r.id).join(', ')}`,
				});
				await fetchProgram(); // 🔥 refresca los cursos
				setSubjects([]); // limpiar las materias en el estado
				setIsCourseModalOpen(false); // cierra el modal
			} else {
				const errorData = (await response.json()) as { error?: string };
				toast.error('Error', {
					description: errorData.error ?? 'Ocurrió un error al procesar la solicitud',
				});
			}
		} catch (error) {
			console.error('Error during course creation:', error);
			toast.error('Error', {
				description: `Error during course creation: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		} finally {
			setUploading(false);
		}
	};

	// Renderizar el componente
	return (
		<div className="h-auto w-full rounded-lg bg-background">
			<div className="group relative h-auto w-full">
				<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-linear-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur-sm transition duration-500 group-hover:opacity-100" />
				<Card
					className={`relative mt-3 h-auto overflow-hidden border-none bg-black p-6 text-white transition-transform duration-300 ease-in-out zoom-in`}
					style={{
						backgroundColor: selectedColor,
						color: getContrastYIQ(selectedColor),
					}}
				>
					<CardHeader className="grid w-full grid-cols-2 justify-evenly md:gap-32 lg:gap-60">
						<CardTitle className={`text-xl font-bold text-primary capitalize`}>
							Programa: {program.title}
						</CardTitle>
						<div className="ml-9 flex flex-col">
							<Label
								className={
									selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
								}
							>
								Seleccione El Color Deseado
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
					<div className={`grid gap-6 md:grid-cols-2`}>
						{/* Columna izquierda - Imagen */}
						<div className="flex w-full flex-col">
							<div className="relative aspect-video w-full">
								<Image
									src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${program.coverImageKey}`}
									alt={program.title}
									width={800}
									height={600}
									className="mx-auto rounded-lg object-contain"
									priority
									quality={75}
								/>
							</div>
							<div className="mt-8 grid grid-cols-4 gap-5" />
						</div>
						{/* Columna derecha - Información */}
						<div className="pb-6">
							<h2 className={`text-xl font-bold text-primary capitalize`}>
								Información Del Programa
							</h2>
							<br />
							<div className="grid grid-cols-2">
								<div className="flex flex-col">
									<h2
										className={`text-base font-semibold capitalize ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Programa:
									</h2>
									<h1
										className={`mb-4 text-xl font-bold text-primary capitalize`}
									>
										{program.title}
									</h1>
								</div>
								<div className="flex flex-col">
									<h2
										className={`text-base font-semibold capitalize ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Categoría:
									</h2>
									<Badge
										variant="outline"
										className="ml-1 w-fit border-primary bg-background text-primary capitalize hover:bg-black/70"
									>
										{program.categoryid}
									</Badge>
								</div>
							</div>
							<div className="mb-4">
								<h2
									className={`text-base font-semibold capitalize ${
										selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
									}`}
								>
									Descripción:
								</h2>
								<p
									className={`text-justify text-sm capitalize ${
										selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
									}`}
								>
									{program.description}
								</p>
							</div>
							<Button
				onClick={handleCreateCourse}
				className="mt-4 bg-secondary text-white"
			>
				Crear Curso
			</Button>
						</div>
					</div>
				</Card>
			</div>
			<br />
			<br />
			<ProgramCoursesList courses={courses} />
			

			<ModalFormCourse
				isOpen={isCourseModalOpen}
				onSubmitAction={handleCreateOrEditCourse}
				editingCourseId={editingCourse ? editingCourse.id : null}
				title={newCourse.title}
				parametros={editParametros}
				setTitle={(title) => setNewCourse((prev) => ({ ...prev, title }))}
				description={newCourse.description ?? ''}
				setDescription={(desc) =>
					setNewCourse((prev) => ({ ...prev, description: desc }))
				}
				categoryid={Number(newCourse.categoryid) || 0}
				setCategoryid={(catId) =>
					setNewCourse((prev) => ({ ...prev, categoryid: Number(catId) }))
				}
				setModalidadesid={(modId) =>
					setNewCourse((prev) => ({ ...prev, modalidadesid: Number(modId) }))
				}
				setNivelid={(nivelId) =>
					setNewCourse((prev) => ({ ...prev, nivelid: Number(nivelId) }))
				}
				modalidadesid={[Number(newCourse.modalidadesid)]}
				nivelid={Number(newCourse.nivelid) || 0}
				coverImageKey={newCourse.coverImageKey ?? ''}
				setCoverImageKey={(cover) =>
					setNewCourse((prev) => ({ ...prev, coverImageKey: cover }))
				}
				setParametrosAction={setEditParametros}
				rating={newCourse.rating ?? 0}
				setRating={(rating) => setNewCourse((prev) => ({ ...prev, rating }))}
				subjects={subjects.map((subject) => ({
					id: subject.id,
					courseId: subject.courseId ?? 0, // 🔥 Corrige `courseId` si está ausente
				}))}
				setSubjects={setSubjects}
				onCloseAction={handleCloseCourseModal}
				uploading={false}
				programId={programIdNumber} // 🔥 Asegurar que pase el programId aquí
			/>

			
		</div>
	);
};

export default ProgramDetail;
