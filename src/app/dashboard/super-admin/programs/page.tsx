'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { FiPlus } from 'react-icons/fi';
import { toast } from 'sonner';

import { SkeletonCard } from '~/components/super-admin/layout/SkeletonCard';
import ModalFormProgram from '~/components/super-admin/modals/ModalFormProgram';
import ProgramListAdmin from '~/components/super-admin/ProgramsListAdmin';
import {
	getPrograms,
	updateProgram,
} from '~/server/queries/queriesSuperAdmin';


// Define el modelo de datos del programa
export interface ProgramModel {
	id: number;
	title: string;
	description: string;
	categoryid: number; // Change to number
	createdAt: string;
	coverImageKey: string;
	creatorId: string;
	rating: number;
}


export type Program = Partial<ProgramModel>;

// Define el modelo de datos de los parámetros de evaluación
export function LoadingPrograms() {
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
	const [programs, setPrograms] = useState<ProgramModel[]>([]);
	const [editingProgram, setEditingProgram] = useState<ProgramModel | null>(
		null
	);
	const [uploading, setUploading] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('');
	const [totalPrograms, setTotalPrograms] = useState(0);
	const [totalStudents, setTotalStudents] = useState(0);
	const [categories, setCategories] = useState<{ id: number; name: string }[]>(
		[]
	);

	// ✅ Obtener programas, totales y categorías
	useEffect(() => {
		async function fetchData() {
			try {
				const programsData = await getPrograms();
				setPrograms(
					programsData.map((program) => ({
						...program,
						id: program.id ?? 0, // ✅ Asegurar que `id` sea un número válido
						description: program.description ?? '', // Ensure description is a string
						coverImageKey: program.coverImageKey ?? '', // Ensure coverImageKey is a string
						rating: program.rating ?? 0, // Ensure rating is a number
						createdAt: typeof program.createdAt === 'string' ? program.createdAt : program.createdAt.toISOString(), // Ensure createdAt is a string
					}))
				);

				// Obtener métricas
				const totalsResponse = await fetch('/api/super-admin/programs/totals');
				if (!totalsResponse.ok) throw new Error('Error obteniendo totales');
				const { totalPrograms, totalStudents } =
					(await totalsResponse.json()) as {
						totalPrograms: number;
						totalStudents: number;
					};

				setTotalPrograms(totalPrograms);
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

	// ✅ Filtrar programas por búsqueda y categoría
	const filteredPrograms = programs.filter(
		(program) =>
			program.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
			(categoryFilter ? program.categoryid === Number(categoryFilter) : true)
	);

	// ✅ Crear o actualizar programa
	const handleCreateOrUpdateProgram = async (
		id: string,
		title: string,
		description: string,
		file: File | null,
		categoryid: number,
		rating: number,
		coverImageKey: string,
		fileName: string
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

		const creatorId =
			user?.fullName ?? user?.emailAddresses[0]?.emailAddress ?? 'Desconocido';

		try {
			let response;
			let responseData: { id: number } | null = null;

			if (id) {
				response = await updateProgram(Number(id), {
					title,
					description: description ?? '',
					coverImageKey: coverImageKey ?? '',
					categoryid: Number(categoryid),
					rating,
					creatorId,
				} as Program);

				responseData = { id: Number(id) }; // Como es una actualización, el ID ya es conocido
			} else {
				response = await fetch('/api/super-admin/programs', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						title,
						description,
						coverImageKey,
						categoryid,
						rating,
						creatorId,
					}),
				});

				if (response.ok) {
					responseData = (await response.json()) as { id: number };
				}
			}

			if (response instanceof Response && response.ok && responseData) {
				toast.success(id ? 'Programa actualizado' : 'Programa creado', {
					description: id
						? 'El programa se actualizó con éxito'
						: 'El programa se creó con éxito',
				});
			} else {
				throw new Error('No se pudo completar la operación');
			}
		} catch (error) {
			toast.error('Error al procesar el programa', {
				description: `Ocurrió un error: ${(error as Error).message}`,
			});
		}

		setIsModalOpen(false);
		setUploading(false);
		const programsData = await getPrograms();
		setPrograms(
			programsData.map((program) => ({
				...program,
				id: program.id ?? 0, // Ensure id is a number
				description: program.description ?? '', // Ensure description is a string
				coverImageKey: program.coverImageKey ?? '', // Ensure coverImageKey is a string
				rating: program.rating ?? 0, // Ensure rating is a number
				createdAt: typeof program.createdAt === 'string' ? program.createdAt : program.createdAt.toISOString(), // Ensure createdAt is a string
			}))
		);
	};

	// Función para abrir el modal de creación de programas
	const handleCreateProgram = () => {
		setEditingProgram({
			id: 0,
			title: '',
			description: '',
			categoryid: 0,
			createdAt: '',
			coverImageKey: '',
			creatorId: '',
			rating: 0,
		});
		setIsModalOpen(true);
	};

	// Función para cerrar el modal de creación de programas
	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingProgram(null);
	};

	// Manejo del título del programa en el modal si no es null
	const setTitle = (title: string) => {
		setEditingProgram((prev) => (prev ? { ...prev, title } : prev));
	};

	// Manejo de la descripción del programa en el modal si no es null
	const setDescription = (description: string) => {
		setEditingProgram((prev) => (prev ? { ...prev, description } : prev));
	};

	// Manejo de la calificación del programa en el modal si no es null
	const setRating = (rating: number) => {
		setEditingProgram((prev) => (prev ? { ...prev, rating } : prev));
	};

	// spinner de carga
	if (uploading) {
		return (
			<main className="flex h-screen flex-col items-center justify-center">
				<div className="size-32 animate-spin rounded-full border-y-2 border-primary">
					<span className="sr-only"></span>
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
					<h1>Gestión de Programas</h1>
				</header>

				{/* Totales y Filtros */}
				<div className="my-4 grid grid-cols-3 gap-4">
					<div className="rounded-lg bg-white p-6 text-black shadow-md">
						<h2 className="text-lg font-bold">Total de Programas</h2>
						<p className="text-3xl">{totalPrograms}</p>
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
						placeholder="Buscar programas..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>

					<button
						onClick={handleCreateProgram}
						className="font-primary flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-white shadow-lg hover:bg-[#0097A7]"
					>
						<FiPlus className="size-5" /> Agregar
					</button>
				</div>

				<ProgramListAdmin
					programs={filteredPrograms}
					onEditProgram={(program: Program | null) =>
						setEditingProgram(program ? {
							id: program.id ?? 0,
							title: program.title ?? '',
							description: program.description ?? '',
							categoryid: program.categoryid ?? 0,
							createdAt: program.createdAt ?? '',
							coverImageKey: program.coverImageKey ?? '',
							creatorId: program.creatorId ?? '',
							rating: program.rating ?? 0,
						} : null)
					}
					onDeleteProgram={(programId) => {
						console.log(`Program with id ${programId} deleted`);
					}}
				/>

				{isModalOpen && (
					<ModalFormProgram
						isOpen={isModalOpen}
						onClose={handleCloseModal}
						onSubmit={handleCreateOrUpdateProgram}
						uploading={uploading}
						editingProgramId={editingProgram?.id ?? null}
						title={editingProgram?.title ?? ''}
						setTitle={setTitle}
						description={editingProgram?.description ?? ''}
						setDescription={setDescription}
						categoryid={editingProgram?.categoryid ?? 0}
						setCategoryid={(categoryid: number) =>
							setEditingProgram((prev) =>
								prev ? { ...prev, categoryid } : null
							)
						}
						coverImageKey={editingProgram?.coverImageKey ?? ''}
						setCoverImageKey={(coverImageKey: string) =>
							setEditingProgram((prev) =>
								prev ? { ...prev, coverImageKey } : null
							)
						}
						rating={editingProgram?.rating ?? 0}
						setRating={setRating}
					/>
				)}
			</div>
		</>
	);
}
