'use client';

import { useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { FiPlus } from 'react-icons/fi';
import { toast } from 'sonner';

import { SkeletonCard } from '~/components/super-admin/layout/SkeletonCard';
import ModalFormCourse from '~/components/super-admin/modals/ModalFormCourse';
import { getCourses, updateCourse } from '~/server/queries/queries';
import type { CourseData } from '~/server/queries/queries';

import CourseListAdmin from './../../components/CourseListAdmin';

// Define el modelo de datos del curso
export interface CourseModel {
	id: number;
	title: string;
	description: string;
	categoryid: string;
	modalidadesid: number;
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
	const { user } = useUser();
	const [courses, setCourses] = useState<CourseData[]>([]);
	const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);
	const [uploading, setUploading] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('');
	const [totalCourses, setTotalCourses] = useState(0);
	const [totalStudents, setTotalStudents] = useState(0);
	const [categories, setCategories] = useState<{ id: number; name: string }[]>(
		[]
	);
	const [parametrosList, setParametrosList] = useState<
		{ id: number; name: string; description: string; porcentaje: number }[]
	>([]);

	// ✅ Obtener cursos, totales y categorías
	useEffect(() => {
		async function fetchData() {
			try {
				const coursesData = await getCourses();
				setCourses(
					coursesData.map((course) => ({
						...course,
						id: course.id ?? 0, // ✅ Asegurar que `id` sea un número válido
					}))
				);

				// Obtener métricas
				const totalsResponse = await fetch('/api/super-admin/courses/totals');
				if (!totalsResponse.ok) throw new Error('Error obteniendo totales');
				const { totalCourses, totalStudents } =
					(await totalsResponse.json()) as {
						totalCourses: number;
						totalStudents: number;
					};

				setTotalCourses(totalCourses);
				setTotalStudents(totalStudents);

				// Obtener categorías
				const categoriesResponse = await fetch('/api/super-admin/categories');
				if (!categoriesResponse.ok)
					throw new Error('Error obteniendo categorías');
				const categoriesData = (await categoriesResponse.json()) as {
					id: number;
					name: string;
				}[];
				setCategories(categoriesData);
			} catch (error) {
				console.error('❌ Error cargando datos:', error);
				toast.error('Error al cargar los datos', {
					description: 'Intenta nuevamente.',
				});
			}
		}
		void fetchData();
	}, []);

	// ✅ Filtrar cursos por búsqueda y categoría
	const filteredCourses = courses.filter(
		(course) =>
			course.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
			(categoryFilter ? course.categoryid === Number(categoryFilter) : true)
	);

	// ✅ Crear o actualizar curso
	const handleCreateOrUpdateCourse = async (
		id: string,
		title: string,
		description: string,
		file: File | null,
		categoryid: number,
		modalidadesid: number,
		nivelid: number,
		rating: number,
		addParametros: boolean,
		coverImageKey: string,
		fileName: string
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
						fileName: file.name,
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

		const instructor =
			user?.fullName ?? user?.emailAddresses[0]?.emailAddress ?? 'Desconocido';

			try {
				let response;
				let responseData: { id: number } | null = null;
			
				if (id) {
					response = await updateCourse(Number(id), {
						title,
						description: description ?? '',
						coverImageKey: coverImageKey ?? '',
						categoryid: Number(categoryid),
						modalidadesid: Number(modalidadesid),
						nivelid: Number(nivelid),
						rating,
						instructor,
					} as CourseData);
			
					responseData = { id: Number(id) }; // Como es una actualización, el ID ya es conocido
				} else {
					response = await fetch('/api/educadores/courses', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							title,
							description,
							coverImageKey,
							categoryid,
							modalidadesid,
							nivelid,
							rating,
							instructor,
						}),
					});
			
					if (response.ok) {
						responseData = await response.json() as { id: number };
					}
				}
			
				if (response instanceof Response && response.ok && responseData) {
					toast.success(id ? 'Curso actualizado' : 'Curso creado', {
						description: id
							? 'El curso se actualizó con éxito'
							: 'El curso se creó con éxito',
					});
			
					// ✅ Guardar parámetros si `addParametros` es `true`
					if (addParametros) {
						for (const parametro of parametrosList) {
							try {
								const parametroResponse = await fetch('/api/educadores/parametros', {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({
										name: parametro.name,
										description: parametro.description,
										porcentaje: parametro.porcentaje,
										courseId: responseData.id, // ✅ Asegura que `courseId` es válido
									}),
								});
			
								if (parametroResponse.ok) {
									toast.success('Parámetro creado exitosamente', {
										description: 'El parámetro se ha creado exitosamente',
									});
								} else {
									const errorData = await parametroResponse.json() as { error: string };
									throw new Error(errorData.error);
								}
							} catch (error) {
								toast.error('Error al crear el parámetro', {
									description: `Ha ocurrido un error al crear el parámetro: ${(error as Error).message}`,
								});
							}
						}
					}
				} else {
					throw new Error('No se pudo completar la operación');
				}
			} catch (error) {
				toast.error('Error al procesar el curso', {
					description: `Ocurrió un error: ${(error as Error).message}`,
				});
			}
			

		setIsModalOpen(false);
		setUploading(false);
		setCourses(await getCourses());
	};

	// Función para abrir el modal de creación de cursos
	const handleCreateCourse = () => {
		setEditingCourse({
			id: 0,
			title: '',
			description: '',
			categoryid: 0,
			modalidadesid: 0,
			createdAt: '',
			instructor: '',
			coverImageKey: '',
			creatorId: '',
			nivelid: 0,
			rating: 0,
		});
		setParametrosList([]);
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

	// Manejo de la calificación del curso en el modal si no es null
	const setRating = (rating: number) => {
		setEditingCourse((prev) => (prev ? { ...prev, rating } : prev));
	};

	// spinner de carga
	if (uploading) {
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
			<div className="p-6">
				<header className="flex items-center justify-between rounded-lg bg-[#3AF4EF] to-[#01142B] p-6 text-3xl font-extrabold text-white shadow-lg">
					<h1>Gestión de Cursos</h1>
				</header>

				{/* Totales y Filtros */}
				<div className="my-4 grid grid-cols-3 gap-4">
					<div className="rounded-lg bg-white p-6 text-black shadow-md">
						<h2 className="text-lg font-bold">Total de Cursos</h2>
						<p className="text-3xl">{totalCourses}</p>
					</div>
					<div className="rounded-lg bg-white p-6 text-black shadow-md">
						<h2 className="text-lg font-bold">Estudiantes Inscritos</h2>
						<p className="text-3xl">{totalStudents}</p>
					</div>
					<div className="rounded-lg bg-white p-6 text-black shadow-md">
						<h2 className="text-lg font-bold">Filtrar por Categoría</h2>
						<select
							className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
						>
							<option value="">Todas</option>
							{categories.map((category) => (
								<option key={category.id} value={category.id}>
									{category.name}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Buscador y botón en la parte inferior */}
				<div className="my-4 flex items-center justify-between rounded-lg p-6 text-black shadow-md">
					<input
						type="text"
						placeholder="Buscar cursos..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>

					<button
						onClick={handleCreateCourse}
						className="font-primary flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-white shadow-lg hover:bg-[#0097A7]"
					>
						<FiPlus className="size-5" /> Agregar
					</button>
				</div>

				<CourseListAdmin
					courses={filteredCourses}
					onEditCourse={(course: CourseData | null) => setEditingCourse(course)}
					onDeleteCourse={(courseId) => {
						console.log(`Course with id ${courseId} deleted`);
					}}
				/>

				{isModalOpen && (
					<ModalFormCourse
						isOpen={isModalOpen}
						onCloseAction={handleCloseModal}
						onSubmitAction={handleCreateOrUpdateCourse}
						uploading={uploading}
						editingCourseId={editingCourse?.id ?? null}
						title={editingCourse?.title ?? ''}
						setTitle={setTitle}
						description={editingCourse?.description ?? ''}
						setDescription={setDescription}
						categoryid={editingCourse?.categoryid ?? 0}
						setCategoryid={(categoryid: number) =>
							setEditingCourse((prev) =>
								prev ? { ...prev, categoryid } : null
							)
						}
						modalidadesid={editingCourse?.modalidadesid ?? 0}
						setModalidadesid={(modalidadesid: number) =>
							setEditingCourse((prev) =>
								prev ? { ...prev, modalidadesid } : null
							)
						}
						nivelid={editingCourse?.nivelid ?? 0}
						setNivelid={(nivelid: number) =>
							setEditingCourse((prev) => (prev ? { ...prev, nivelid } : null))
						}
						coverImageKey={editingCourse?.coverImageKey ?? ''}
						setCoverImageKey={(coverImageKey: string) =>
							setEditingCourse((prev) =>
								prev ? { ...prev, coverImageKey } : null
							)
						}
						rating={editingCourse?.rating ?? 0}
						setRating={setRating}
						parametros={parametrosList.map((parametro, index) => ({
							...parametro,
							id: index,
						}))}
						setParametrosAction={setParametrosList}
					/>
				)}
			</div>
		</>
	);
}
