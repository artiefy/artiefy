'use client';
import { useCallback, useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { FiPlus } from 'react-icons/fi';
import { toast } from 'sonner';

import CourseListTeacher from '~/components/educators/layout/CourseListTeacher';
import { SkeletonCard } from '~/components/educators/layout/SkeletonCard';
import ModalFormCourse from '~/components/educators/modals/ModalFormCourse';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/super-admin/ui/breadcrumb';
import { Button } from '~/components/educators/ui/button';

// Define el modelo de datos del curso
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

// Define el modelo de datos de los parámetros de evaluación
export function LoadingCourses() {
	return (
		<div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: 9 }).map((_, index) => (
				<SkeletonCard key={index} />
			))}
		</div>
	);
}

export default function Page() {
	const { user } = useUser(); // interfaz de usuario
	const [courses, setCourses] = useState<CourseModel[]>([]); // interfaz de cursos
	const [editingCourse, setEditingCourse] = useState<CourseModel | null>(null); // interfaz de cursos
	const [uploading, setUploading] = useState(false); // interfaz de cursos
	const [isModalOpen, setIsModalOpen] = useState(false); // interfaz de cursos
	const [loading, setLoading] = useState(true); // interfaz de cursos
	const [error, setError] = useState<string | null>(null); // interfaz de cursos
	const [parametrosList, setParametrosList] = useState<
		{
			id: number;
			name: string;
			description: string;
			porcentaje: number;
		}[]
	>([]); // interfaz de cursos
	const [subjects, setSubjects] = useState<string[]>([]); // Change subjects state to string[]

	// Función para cargar los cursos by userId
	const fetchCourses = useCallback(async () => {
		if (!user) return;
		try {
			setLoading(true);
			setError(null);
			const response = await fetch(`/api/educadores/courses?userId=${user.id}`);
			if (response.ok) {
				const data = (await response.json()) as CourseModel[];
				setCourses(
					data.map((course) => ({
						...course,
						nivelid: course.nivelid ?? '', // Map it properly
						categoryid: course.categoryid, // Map categoryid properly
						modalidadesid: course.modalidadesid, // Map modalidadesid properly
					})) as CourseModel[]
				);
			} else {
				const errorData = (await response.json()) as { error?: string };
				const errorMessage = errorData.error ?? response.statusText;
				setError(`Error al cargar los cursos: ${errorMessage}`);
				toast.error('Error', {
					description: `No se pudieron cargar los cursos: ${errorMessage}`,
				});
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Error desconocido';
			setError(`Error al cargar los cursos: ${errorMessage}`);
			toast.error('Error', {
				description: `No se pudieron cargar los cursos: ${errorMessage}`,
			});
		} finally {
			setLoading(false);
		}
	}, [user]);

	// Function to fetch subjects
	const fetchSubjects = useCallback(async () => {
		try {
			const response = await fetch(
				'/api/educadores/courses?fetchSubjects=true'
			);
			if (response.ok) {
				const data = (await response.json()) as {
					id: number;
					title: string;
					description: string;
				}[];
				console.log('Fetched subjects:', data); // Add console log to debug
				setSubjects(data.map((subject) => subject.title)); // Map subjects to strings
			} else {
				const errorData = (await response.json()) as { error?: string };
				const errorMessage = errorData.error ?? response.statusText;
				toast.error('Error', {
					description: `No se pudieron cargar las materias: ${errorMessage}`,
				});
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Error desconocido';
			toast.error('Error', {
				description: `No se pudieron cargar las materias: ${errorMessage}`,
			});
		}
	}, []);

	// Cargar los cursos al montar el componente
	useEffect(() => {
		if (user) {
			fetchCourses().catch((error) =>
				console.error('Error fetching courses:', error)
			);
			fetchSubjects().catch((error) =>
				console.error('Error fetching subjects:', error)
			);
		}
	}, [user, fetchCourses, fetchSubjects]);

	// Función para crear o editar un curso "los datos vienen del modal"
	const handleCreateOrEditCourse = async (
		_id: string,
		title: string,
		description: string,
		file: File | null,
		categoryid: number,
		modalidadesid: number,
		nivelid: number,
		rating: number, // Añadir esta línea
		addParametros: boolean, // Cambiar options por addParametros
		coverImageKey: string,
		fileName: string // Nuevo parámetro
	) => {
		if (!user) return;

		// Validar que haya al menos un parámetro si addParametros es true
		if (addParametros && parametrosList.length === 0) {
			toast.error('Error', {
				description: 'Debe agregar al menos un parámetro de evaluación',
			});
			return;
		}

		try {
			setUploading(true);
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
					throw new Error(
						`Error: al iniciar la carga: ${uploadResponse.statusText}`
					);
				}

				const uploadData = (await uploadResponse.json()) as {
					url: string;
					fields: Record<string, string>;
					key: string;
					fileName: string;
				};

				const { url, fields, key, fileName: responseFileName } = uploadData;
				coverImageKey = key;
				fileName = responseFileName;

				const formData = new FormData();
				Object.entries(fields).forEach(([key, value]) => {
					if (typeof value === 'string') {
						formData.append(key, value);
					}
				});
				formData.append('file', file);

				await fetch(url, {
					method: 'POST',
					body: formData,
				});
			}
			setUploading(false);
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : 'Unknown error';
			throw new Error(`Error to upload the file type ${errorMessage}`);
		}
		const response = await fetch('/api/educadores/courses', {
			method: 'POST', // Asegúrate de usar 'POST' cuando no estás editando
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				id: editingCourse?.id,
				title,
				description,
				coverImageKey,
				fileName, // Agregar fileName al cuerpo de la solicitud
				categoryid,
				modalidadesid,
				instructor: user.fullName,
				creatorId: user.id,
				nivelid,
				rating, // Añadir esta línea
			}),
		});

		if (response.ok) {
			const responseData = (await response.json()) as { id: number };

			toast.success(editingCourse ? 'Curso actualizado' : 'Curso creado', {
				description: editingCourse
					? 'El curso se actualizó con éxito'
					: 'El curso se creó con éxito',
			});

			// Guardar parámetros en la base de datos si addParametros es true
			if (addParametros) {
				for (const parametro of parametrosList) {
					try {
						const response = await fetch('/api/educadores/parametros', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								name: parametro.name,
								description: parametro.description,
								porcentaje: parametro.porcentaje,
								courseId: responseData.id, // Asegúrate de pasar el courseId aquí
							}),
						});

						if (response.ok) {
							toast.success('Parámetro creado exitosamente', {
								description: 'El parámetro se ha creado exitosamente',
							});
						} else {
							const errorData = (await response.json()) as { error: string };
							throw new Error(errorData.error);
						}
					} catch (error) {
						toast.error('Error al crear el parámetro', {
							description: `Ha ocurrido un error al crear el parámetro: ${(error as Error).message}`,
						});
					}
				}
			}

			fetchCourses().catch((error) =>
				console.error('Error fetching courses:', error)
			);
			setEditingCourse(null);
			setIsModalOpen(false);
		} else {
			const errorData = (await response.json()) as { error?: string };
			toast.error('Error', {
				description:
					errorData.error ?? 'Ocurrió un error al procesar la solicitud',
			});
		}
	};

	// Función para abrir el modal de creación de cursos
	const handleCreateCourse = () => {
		setEditingCourse({
			id: 0,
			title: '',
			description: '',
			categoryid: '',
			modalidadesid: '',
			createdAt: '',
			instructor: '',
			coverImageKey: '',
			creatorId: '',
			nivelid: '',
			totalParametros: 0,
			rating: 0, // Añadir esta línea
		});
		setParametrosList([]); // Resetear la lista de parámetros al crear un nuevo curso
		setIsModalOpen(true);
	};

	// Función para cerrar el modal de creación de cursos
	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingCourse(null);
		setParametrosList([]);
	};

	// Manejo del título del curso en el modal si no es null
	const setTitle = (title: string) => {
		setEditingCourse((prev) => (prev ? { ...prev, title } : prev));
	};

	// Manejo de la descripción del curso en el modal si no es null
	const setDescription = (description: string) => {
		setEditingCourse((prev) => (prev ? { ...prev, description } : prev));
	};

	// Manejo de la categoría del curso en el modal si no es null
	const setCategoryid = (categoryid: number) => {
		setEditingCourse((prev) =>
			prev ? { ...prev, categoryid: String(categoryid) } : prev
		);
	};

	// Manejo de la modalidad del curso en el modal si no es null
	const setModalidadesid = (modalidadesid: number) => {
		setEditingCourse((prev) =>
			prev ? { ...prev, modalidadesid: String(modalidadesid) } : prev
		);
	};

	// Manejo de la nivel del curso en el modal si no es null
	const setNivelid = (nivelid: number) => {
		setEditingCourse((prev) =>
			prev ? { ...prev, nivelid: String(nivelid) } : prev
		);
	};

	// Manejo de la imagen de portada del curso en el modal si no es null
	const setCoverImageKey = (coverImageKey: string) => {
		setEditingCourse((prev) => (prev ? { ...prev, coverImageKey } : prev));
	};

	// Manejo de la calificación del curso en el modal si no es null
	const setRating = (rating: number) => {
		setEditingCourse((prev) => (prev ? { ...prev, rating } : prev));
	};

	// spinner de carga
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

	// Renderizado de la vista
	return (
		<>
			<main className="h-auto">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink
								className="text-primary hover:text-gray-300"
								href="../super-admin"
							>
								Inicio
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink
								className="text-primary hover:text-gray-300"
								href="/"
							>
								Lista de cursos
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
					</BreadcrumbList>
				</Breadcrumb>
				<div className="container">
					<div className="mt-2 flex justify-between">
						<h1 className="text-3xl font-bold">Panel de cursos</h1>
					</div>
					{loading ? (
						<LoadingCourses />
					) : error ? (
						<div className="mt-10 flex flex-col items-center justify-center py-10 text-center">
							<p className="text-xl text-red-600">{error}</p>
							<button
								onClick={fetchCourses}
								className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
							>
								Reintentar
							</button>
						</div>
					) : courses.length === 0 ? (
						<div className="mt-10 flex flex-col items-center justify-center py-10 text-center">
							<h2 className="mb-4 text-2xl font-bold">
								Listado de Cursos Asociados
							</h2>
							<p className="text-xl text-gray-600">
								No hay cursos asociados todavía
							</p>
							<p className="my-2 text-gray-500">
								Todavía no tienes cursos asociados. Cuando los tengas,
								aparecerán aquí. &quot;Crear Curso&quot;
							</p>
							<span>&#128071;&#128071;&#128071;</span>
						</div>
					) : (
						<>
							<h2 className="mt-5 mb-4 text-2xl font-bold">
									Listado de Cursos Asociados
							</h2>
							<CourseListTeacher courses={courses} />
						</>
					)}
					{isModalOpen && (
						<ModalFormCourse
							onSubmitAction={handleCreateOrEditCourse}
							uploading={uploading}
							editingCourseId={editingCourse ? editingCourse.id : null}
							title={editingCourse?.title ?? ''}
							setTitle={setTitle}
							description={editingCourse?.description ?? ''}
							setDescription={setDescription}
							categoryid={editingCourse ? Number(editingCourse.categoryid) : 0}
							setCategoryid={setCategoryid}
							modalidadesid={Number(editingCourse?.modalidadesid) || 0}
							setModalidadesid={setModalidadesid}
							nivelid={Number(editingCourse?.nivelid) || 0}
							setNivelid={setNivelid}
							coverImageKey={editingCourse?.coverImageKey ?? ''}
							setCoverImageKey={setCoverImageKey}
							parametros={parametrosList.map((parametro, index) => ({
								...parametro,
								id: index,
							}))}
							setParametrosAction={setParametrosList}
							isOpen={isModalOpen}
							onCloseAction={handleCloseModal}
							rating={editingCourse?.rating ?? 0} // Añadir esta línea
							setRating={setRating}
							subjects={subjects} // Pass subjects state
							setSubjects={setSubjects} // Pass setSubjects function
						/>
					)}
				</div>
			</main>
		</>
	);
}
