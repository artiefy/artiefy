'use client';

import { useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { FiPlus } from 'react-icons/fi';
import { toast } from 'sonner';

import CourseListAdmin from '~/app/dashboard/super-admin/components/CourseListAdmin';
import { SkeletonCard } from '~/components/super-admin/layout/SkeletonCard';
import ModalFormCourse from '~/components/super-admin/modals/ModalFormCourse';
import {
	getCourses,
	updateCourse,
	type CourseData,
} from '~/server/queries/queries';

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
	const [subjects, setSubjects] = useState<{ id: number }[]>([]);
	const [categories, setCategories] = useState<{ id: number; name: string }[]>(
		[]
	);
	const [parametrosList, setParametrosList] = useState<
		{ id: number; name: string; description: string; porcentaje: number }[]
	>([]);
	const [educators, setEducators] = useState<{ id: string; name: string }[]>(
		[]
	);
	const [currentPage, setCurrentPage] = useState(1);
	const [showProgramCourses, setShowProgramCourses] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const coursesPerPage = 6;

	// ✅ Obtener cursos, totales y categorías con lazy loading
	useEffect(() => {
		async function fetchData() {
			try {
				// First load - quick fetch of first page
				const initialData = await getCourses({
					page: 1,
					limit: coursesPerPage,
				});

				setCourses(initialData.data);
				setTotalCourses(initialData.total);

				// Then load the rest in background
				setIsLoadingMore(true);
				const allData = await getCourses({
					page: 1,
					limit: initialData.total, // Get all remaining courses
				});
				setCourses(allData.data);
				setIsLoadingMore(false);

				// Get other data in parallel
				const [totalsResponse, categoriesResponse] = await Promise.all([
					fetch('/api/super-admin/courses/totals'),
					fetch('/api/super-admin/categories'),
				]);

				if (!totalsResponse.ok) throw new Error('Error obteniendo totales');
				const { totalStudents } = (await totalsResponse.json()) as {
					totalStudents: number;
				};
				setTotalStudents(totalStudents);

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
	}, []); // Only run on mount

	useEffect(() => {
		const loadEducators = async () => {
			try {
				const response = await fetch('/api/super-admin/changeEducators');
				if (response.ok) {
					const data = (await response.json()) as {
						id: string;
						name: string;
					}[];
					setEducators(data);
				}
			} catch (error) {
				console.error('Error al cargar educadores:', error);
			}
		};
		void loadEducators();
	}, []);

	// ✅ Filtrar cursos por búsqueda y categoría
	const filteredCourses = courses.filter(
		(course) =>
			course.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
			(categoryFilter ? course.categoryid === Number(categoryFilter) : true)
	);

	// Modify the filtering logic for program/independent courses
	const programCourses = filteredCourses.filter(
		(course) => course.programas && course.programas.length > 0
	);
	const nonProgramCourses = filteredCourses.filter(
		(course) => !course.programas || course.programas.length === 0
	);

	// Get current courses based on pagination and filter
	const currentCourses = showProgramCourses
		? programCourses
		: nonProgramCourses;

	// Add console logs for debugging
	console.log('Filtered courses:', {
		total: filteredCourses.length,
		program: programCourses.length,
		independent: nonProgramCourses.length,
		showing: showProgramCourses ? 'program' : 'independent',
		current: currentCourses.length,
	});

	const totalPages = Math.ceil(currentCourses.length / coursesPerPage);
	const indexOfLastCourse = currentPage * coursesPerPage;
	const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
	const displayedCourses = currentCourses.slice(
		indexOfFirstCourse,
		indexOfLastCourse
	);

	const handleNextPage = () => {
		setCurrentPage((prev) => Math.min(prev + 1, totalPages));
	};

	const handlePrevPage = () => {
		setCurrentPage((prev) => Math.max(prev - 1, 1));
	};

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
				void fileName;

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

		try {
			let response;
			let responseData: { id: number } | null = null;

			// Get instructor name from educators array based on selected instructor ID
			const selectedEducator = educators.find(
				(edu) => edu.id === editingCourse?.instructor
			);
			const instructorName = selectedEducator?.name ?? '';

			if (id) {
				response = await updateCourse(Number(id), {
					title,
					description: description ?? '',
					coverImageKey: coverImageKey ?? '',
					categoryid: Number(categoryid),
					modalidadesid: Number(modalidadesid),
					nivelid: Number(nivelid),
					rating,
					instructor: instructorName, // Use instructor name instead of ID
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
						instructor: instructorName, // Use instructor name instead of ID
						subjects,
					}),
				});

				if (response.ok) {
					responseData = (await response.json()) as { id: number };
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
							const parametroResponse = await fetch(
								'/api/educadores/parametros',
								{
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({
										name: parametro.name,
										description: parametro.description,
										porcentaje: parametro.porcentaje,
										courseId: responseData.id, // ✅ Asegura que `courseId` es válido
									}),
								}
							);

							if (parametroResponse.ok) {
								toast.success('Parámetro creado exitosamente', {
									description: 'El parámetro se ha creado exitosamente',
								});
							} else {
								const errorData = (await parametroResponse.json()) as {
									error: string;
								};
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
		const { data: coursesData } = await getCourses();
		setCourses(
			coursesData.map((course) => ({
				...course,
				isActive: course.isActive ?? undefined, // Ensure isActive is boolean or undefined
			}))
		);
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
				<div className="border-primary size-32 rounded-full border-y-2">
					<span className="sr-only" />
				</div>
				<span className="text-primary">Cargando...</span>
			</main>
		);
	}

	// Renderizado de la vista
	return (
		<div className="p-4 sm:p-6">
			{/* Header with gradient effect */}
			<header className="group relative overflow-hidden rounded-lg p-[1px]">
				<div className="animate-gradient absolute -inset-0.5 bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-75 blur transition duration-500" />
				<div className="relative flex flex-col items-start justify-between rounded-lg bg-gray-800 p-4 text-white shadow-lg transition-all duration-300 group-hover:bg-gray-800/95 sm:flex-row sm:items-center sm:p-6">
					<h1 className="text-primary flex items-center gap-3 text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl">
						Gestión de Cursos
					</h1>
				</div>
			</header>

			{/* Stats Cards */}
			<div className="my-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div className="rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm sm:p-6">
					<h2 className="text-base font-semibold text-gray-400 sm:text-lg">
						Total de Cursos
					</h2>
					<p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
						{totalCourses}
					</p>
				</div>
				<div className="rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm sm:p-6">
					<h2 className="text-base font-semibold text-gray-400 sm:text-lg">
						Estudiantes Inscritos
					</h2>
					<p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
						{totalStudents}
					</p>
				</div>
				<div className="rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm sm:p-6">
					<h2 className="text-base font-semibold text-gray-400 sm:text-lg">
						Filtrar por Categoría
					</h2>
					<select
						className="mt-2 w-full rounded-md border border-gray-700 bg-gray-900/50 px-3 py-1.5 text-white sm:px-4 sm:py-2"
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

			{/* Search and Add Button */}
			<div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="col-span-1 rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm lg:col-span-3">
					<input
						type="text"
						placeholder="Buscar cursos..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-4 py-2 text-white placeholder:text-gray-400"
					/>
				</div>
				<div className="col-span-1">
					<button
						onClick={handleCreateCourse}
						className="group/button bg-background text-primary hover:bg-primary/10 relative inline-flex h-full w-full items-center justify-center gap-1 overflow-hidden rounded-md border border-white/20 px-2 py-1.5 text-xs transition-all sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
					>
						<span className="relative z-10 font-medium">Crear Curso</span>
						<FiPlus className="relative z-10 size-3.5 sm:size-4" />
						<div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
					</button>
				</div>
			</div>

			{/* Program Filter Buttons */}
			<div className="mb-6 flex justify-center gap-4">
				<button
					onClick={() => {
						setShowProgramCourses(false);
						setCurrentPage(1);
					}}
					className={`rounded-md px-4 py-2 ${
						!showProgramCourses
							? 'bg-primary text-white'
							: 'bg-gray-800 text-gray-300'
					}`}
				>
					Cursos Independientes
				</button>
				<button
					onClick={() => {
						setShowProgramCourses(true);
						setCurrentPage(1);
					}}
					className={`rounded-md px-4 py-2 ${
						showProgramCourses
							? 'bg-primary text-background'
							: 'bg-gray-800 text-gray-300'
					}`}
				>
					Cursos en Programas
				</button>
			</div>

			{/* Course List with Loading Indicator */}
			<CourseListAdmin
				courses={displayedCourses}
				onEditCourse={(course) => setEditingCourse(course)}
				onDeleteCourse={(courseId) => {
					console.log(`Course with id ${courseId} deleted`);
				}}
			/>

			{isLoadingMore && (
				<div className="mt-4 text-center text-sm text-gray-400">
					Cargando cursos adicionales...
				</div>
			)}

			{/* Pagination Controls */}
			<div className="mt-6 flex justify-center gap-4">
				<button
					onClick={handlePrevPage}
					disabled={currentPage === 1 || isLoadingMore}
					className="rounded-md bg-gray-800 px-4 py-2 text-white disabled:opacity-50"
				>
					Anterior
				</button>
				<span className="flex items-center text-white">
					Página {currentPage} de {totalPages}
					{isLoadingMore && ' (Cargando...)'}
				</span>
				<button
					onClick={handleNextPage}
					disabled={currentPage === totalPages || isLoadingMore}
					className="rounded-md bg-gray-800 px-4 py-2 text-white disabled:opacity-50"
				>
					Siguiente
				</button>
			</div>

			{/* Modal Components */}
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
						setEditingCourse((prev) => (prev ? { ...prev, categoryid } : null))
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
					courseTypeId={null}
					setCourseTypeId={(courseTypeId: number | null) =>
						console.log('Course Type ID set to:', courseTypeId)
					}
					isActive={true}
					setIsActive={(isActive: boolean) =>
						console.log('Is Active set to:', isActive)
					}
					instructor={editingCourse?.instructor ?? ''}
					setInstructor={(instructor: string) =>
						setEditingCourse((prev) => (prev ? { ...prev, instructor } : null))
					}
					educators={educators}
					subjects={subjects}
					setSubjects={setSubjects}
				/>
			)}
		</div>
	);
}
