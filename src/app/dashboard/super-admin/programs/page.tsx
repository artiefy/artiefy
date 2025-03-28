'use client';

import { useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { FiPlus } from 'react-icons/fi';
import {
	PiCodeBold,
	PiDatabaseBold,
	PiGameControllerBold,
	PiShieldCheckBold,
	PiWindBold,
	PiComputerTowerBold,
	PiCalculatorBold,
	PiAtomBold,
	PiPaintBrushBold,
	PiMegaphoneBold,
	PiBrainBold,
	PiCloudBold,
	PiGlobeBold,
	PiBrowserBold,
	PiDeviceMobileBold,
	PiRobotBold,
	PiAppWindowBold,
	PiSunBold,
	PiBooksBold,
	PiScissorsBold,
	PiChartLineUpBold,
	PiGraduationCapBold,
} from 'react-icons/pi';
import { toast } from 'sonner';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/educators/ui/alert-dialog';
import { Button } from '~/components/estudiantes/ui/button';
import { SkeletonCard } from '~/components/super-admin/layout/SkeletonCard';
import ModalFormProgram from '~/components/super-admin/modals/ModalFormProgram';
import ProgramListAdmin from '~/components/super-admin/ProgramsListAdmin';
import { getPrograms } from '~/server/queries/queriesSuperAdmin';

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

// Add this interface near the top with other interfaces
interface Category {
	id: number;
	name: string;
	is_featured: boolean;
}

// Define el modelo de datos de los parámetros de evaluación
export function LoadingPrograms() {
	return (
		<div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: 9 }).map((_, index) => (
				<SkeletonCard key={index} />
			))}
		</div>
	);
}

export default function Page() {
	const { user } = useUser();
	const [programs, setPrograms] = useState<ProgramModel[]>([]);
	const [editingProgram, setEditingProgram] = useState<Program | null>(null);
	const [uploading, setUploading] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('');
	const [totalPrograms, setTotalPrograms] = useState(0);
	const [totalStudents, setTotalStudents] = useState(0);
	// Update the state definition to use the new interface
	const [categories, setCategories] = useState<Category[]>([]);
	const [selectedPrograms, setSelectedPrograms] = useState<number[]>([]);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);

	// ✅ Obtener programas, totales y categorías
	useEffect(() => {
		async function fetchData() {
			try {
				const programsData = await getPrograms();
				setPrograms(
					programsData.map(
						(program): ProgramModel => ({
							id: program.id ?? 0,
							title: program.title ?? '',
							description: program.description ?? '',
							categoryid: program.categoryid ?? 0,
							createdAt:
								typeof program.createdAt === 'string'
									? program.createdAt
									: (program.createdAt?.toISOString() ??
										new Date().toISOString()),
							coverImageKey: program.coverImageKey ?? '',
							creatorId: program.creatorId ?? '',
							rating: program.rating ?? 0,
						})
					)
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
				// Update the type assertion for categoriesData
				const categoriesData = (await categoriesResponse.json()) as Category[];
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

	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, categoryFilter]);

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
		fileName: string,
		subjectIds: number[]
	) => {
		if (!user) return;
		console.log('📤 Enviando programa con subjectIds:', subjectIds);

		try {
			setUploading(true);
			if (file) {
				const uploadResponse = await fetch('/api/upload', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contentType: file.type,
						fileSize: file.size,
						fileName: fileName || file.name, // Use provided fileName or fallback to file.name
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
				};

				const { url, fields, key } = uploadData;
				coverImageKey = key;

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
			// 🔹 Convertir `selectedSubjects` a un array de números antes de enviar

			if (id) {
				response = await fetch(`/api/super-admin/programs?programId=${id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						title,
						description: description ?? '',
						coverImageKey: coverImageKey ?? '',
						categoryid: Number(categoryid),
						rating,
						creatorId,
						subjectIds, // ✅ Enviar materias
					}),
				});

				if (!response.ok) {
					throw new Error('Error al actualizar el programa');
				}

				responseData = (await response.json()) as { id: number };
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
						subjectIds,
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

				// Refresh the programs list
				const programsData = await getPrograms();
				setPrograms(
					programsData.map((program) => ({
						...program,
						id: program.id ?? 0,
						description: program.description ?? '',
						coverImageKey: program.coverImageKey ?? '',
						rating: program.rating ?? 0,
						createdAt:
							typeof program.createdAt === 'string'
								? program.createdAt
								: program.createdAt.toISOString(),
					}))
				);
			}
		} catch (error) {
			toast.error('Error al procesar el programa', {
				description: `Ocurrió un error: ${(error as Error).message}`,
			});
		} finally {
			setUploading(false);
			setEditingProgram(null); // Reset editing state
		}

		setIsModalOpen(false);
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

	const handleDeleteSelected = async () => {
		try {
			const response = await fetch('/api/super-admin/programs/deleteProgram', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ programIds: selectedPrograms }),
			});

			if (!response.ok) {
				throw new Error('Error al eliminar los programas');
			}

			toast.success(
				`${selectedPrograms.length} programa(s) eliminado(s) exitosamente`
			);
			setSelectedPrograms([]);
			// Refresh programs list
			const programsData = await getPrograms();
			setPrograms(
				programsData.map(
					(program): ProgramModel => ({
						id: program.id ?? 0,
						title: program.title ?? '',
						description: program.description ?? '',
						categoryid: program.categoryid ?? 0,
						createdAt:
							typeof program.createdAt === 'string'
								? program.createdAt
								: (program.createdAt?.toISOString() ??
									new Date().toISOString()),
						coverImageKey: program.coverImageKey ?? '',
						creatorId: program.creatorId ?? '',
						rating: program.rating ?? 0,
					})
				)
			);
		} catch (error) {
			toast.error('Error al eliminar los programas');
			console.error('Error:', error);
		}
		setShowDeleteConfirm(false);
	};

	const toggleProgramSelection = (programId: number) => {
		setSelectedPrograms((prev) =>
			prev.includes(programId)
				? prev.filter((id) => id !== programId)
				: [...prev, programId]
		);
	};

	const handleEditProgram = (program: Program) => {
		setEditingProgram(program);
		setIsModalOpen(true);
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

	// Add this helper function to get icon by category
	const getCategoryIcon = (categoryName: string) => {
		const icons: Record<string, React.ReactNode> = {
			Redes: <PiCloudBold className="size-5" />,
			APIs: <PiGlobeBold className="size-5" />,
			'Análisis de Datos': <PiChartLineUpBold className="size-5" />,
			Videojuegos: <PiGameControllerBold className="size-5" />,
			Seguridad: <PiShieldCheckBold className="size-5" />,
			'Frameworks Web': <PiWindBold className="size-5" />,
			Tecnología: <PiComputerTowerBold className="size-5" />,
			Matemáticas: <PiCalculatorBold className="size-5" />,
			Ciencias: <PiAtomBold className="size-5" />,
			Diseño: <PiPaintBrushBold className="size-5" />,
			Marketing: <PiMegaphoneBold className="size-5" />,
			'Machine Learning': <PiBrainBold className="size-5" />,
			'Bases de Datos': <PiDatabaseBold className="size-5" />,
			'Desarrollo Web': <PiBrowserBold className="size-5" />,
			Programación: <PiCodeBold className="size-5" />,
			'Desarrollo Móvil': <PiDeviceMobileBold className="size-5" />,
			'Inteligencia Artificial': <PiRobotBold className="size-5" />,
			'Desarrollo de Software': <PiAppWindowBold className="size-5" />,
			'Energía Solar': <PiSunBold className="size-5" />,
			Humanidades: <PiBooksBold className="size-5" />,
			Cosmetología: <PiScissorsBold className="size-5" />,
			Emprendimiento: <PiChartLineUpBold className="size-5" />,
		};
		return icons[categoryName] ?? <PiCodeBold className="size-5" />;
	};

	// Renderizado de la vista
	return (
		<>
			<div className="p-4 sm:p-6">
				<header className="group relative overflow-hidden rounded-lg p-[1px]">
					<div className="absolute -inset-0.5 animate-gradient bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-75 blur transition duration-500" />
					<div className="relative flex flex-col items-start justify-between rounded-lg bg-gray-800 p-4 text-white shadow-lg transition-all duration-300 group-hover:bg-gray-800/95 sm:flex-row sm:items-center sm:p-6">
						<h1 className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-primary sm:text-2xl lg:text-3xl">
							Gestión de Programas
						</h1>
					</div>
				</header>

				{/* Totales y Filtros */}
				<div className="my-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<div className="rounded-lg bg-white p-4 text-center text-black shadow-md sm:p-6">
						<h2 className="text-base font-bold sm:text-lg">Total de</h2>
						<h2 className="text-base font-bold sm:text-lg">Programas</h2>
						<p className="text-2xl sm:text-3xl">{totalPrograms}</p>
					</div>
					<div className="rounded-lg bg-white p-4 text-center text-black shadow-md sm:p-6">
						<h2 className="text-base font-bold sm:text-lg">
							Estudiantes Inscritos
						</h2>
						<p className="text-2xl sm:text-3xl">{totalStudents}</p>
					</div>
					<div className="rounded-lg bg-white p-4 text-center text-black shadow-md sm:p-6">
						<h2 className="text-base font-bold sm:text-lg">
							Filtrar por Categoría
						</h2>
						<select
							className="mt-2 w-full rounded-md border border-gray-300 px-3 py-1.5 sm:px-4 sm:py-2"
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

				{/* Buscador y botón */}
				<div className="my-4 flex flex-col gap-4 rounded-lg p-4 text-black shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-6">
					<input
						type="text"
						placeholder="Buscar programas..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 sm:px-4 sm:py-2"
					/>

					<div className="flex flex-col gap-2 sm:flex-row">
						{selectedPrograms.length > 0 && (
							<Button
								onClick={() => setShowDeleteConfirm(true)}
								className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
							>
								Eliminar ({selectedPrograms.length})
							</Button>
						)}
						<button
							onClick={handleCreateProgram}
							className="group/button relative inline-flex w-full items-center justify-center gap-1 overflow-hidden rounded-md border border-white/20 bg-background px-2 py-1.5 text-xs text-primary transition-all hover:bg-primary/10 sm:w-[220px] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
						>
							<span className="relative z-10 font-medium">
								Agregar Programa
							</span>
							<FiPlus className="relative z-10 size-3.5 sm:size-4" />
							<div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 group-hover/button:[transform:translateX(100%)] group-hover/button:opacity-100" />
						</button>
					</div>
				</div>

				{/* Featured Categories */}
				<nav className="mb-6">
					<div className="flex flex-wrap items-center gap-2">
						{/* All Categories Button */}
						<button
							onClick={() => setCategoryFilter('')}
							className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all ${
								!categoryFilter
									? 'border-primary bg-primary/10 text-primary'
									: 'border-gray-200 hover:border-gray-300'
							}`}
						>
							<PiGraduationCapBold className="size-4" />
							<span>Todas</span>
						</button>

						{/* Show only top 4 categories on mobile, 8 on desktop */}
						{categories
							.filter((category) => category.is_featured)
							.slice(0, window.innerWidth < 640 ? 4 : 8)
							.map((category) => {
								const isSelected = categoryFilter === category.id.toString();
								const programCount = programs.filter(
									(p) => p.categoryid === category.id
								).length;

								return (
									<button
										key={category.id}
										onClick={() => setCategoryFilter(category.id.toString())}
										className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all ${
											isSelected
												? 'border-primary bg-primary/10 text-primary'
												: 'border-gray-200 hover:border-gray-300'
										}`}
									>
										{getCategoryIcon(category.name)}
										<span className="max-w-[80px] truncate sm:max-w-[120px]">
											{category.name}
										</span>
										{programCount > 0 && (
											<span
												className={
													isSelected ? 'text-primary' : 'text-gray-500'
												}
											>
												({programCount})
											</span>
										)}
									</button>
								);
							})}

						{/* More Categories Dropdown */}
						{categories.filter((c) => c.is_featured).length >
							(window.innerWidth < 640 ? 4 : 8) && (
							<select
								onChange={(e) => setCategoryFilter(e.target.value)}
								className="rounded-full border border-gray-200 px-3 py-1.5 text-sm hover:border-gray-300"
								value={categoryFilter}
							>
								<option value="">Más categorías...</option>
								{categories
									.filter((category) => category.is_featured)
									.slice(window.innerWidth < 640 ? 4 : 8)
									.map((category) => (
										<option key={category.id} value={category.id}>
											{category.name} (
											{
												programs.filter((p) => p.categoryid === category.id)
													.length
											}
											)
										</option>
									))}
							</select>
						)}
					</div>
				</nav>

				<AlertDialog
					open={showDeleteConfirm}
					onOpenChange={setShowDeleteConfirm}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
							<AlertDialogDescription>
								Esta acción eliminará {selectedPrograms.length} programa(s) y
								todos sus datos relacionados. Esta acción no se puede deshacer.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancelar</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleDeleteSelected}
								className="bg-red-600 text-white hover:bg-red-700"
							>
								Eliminar
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				<div className="mt-4 sm:mt-6">
					<ProgramListAdmin
						programs={filteredPrograms}
						selectedPrograms={selectedPrograms}
						onToggleSelection={toggleProgramSelection}
						onEditProgram={handleEditProgram}
						onDeleteProgram={(programId) => {
							console.log(`Program with id ${programId} deleted`);
						}}
						categories={categories} // Add this line
						currentPage={currentPage}
						onPageChange={setCurrentPage}
						itemsPerPage={6}
					/>
				</div>

				{isModalOpen && (
					<ModalFormProgram
						isOpen={isModalOpen}
						onCloseAction={() => {
							setIsModalOpen(false);
							setEditingProgram(null);
						}}
						onSubmitAction={handleCreateOrUpdateProgram}
						uploading={uploading}
						editingProgramId={editingProgram?.id ?? null}
						title={editingProgram?.title ?? ''}
						setTitle={(title) =>
							setEditingProgram((prev) => (prev ? { ...prev, title } : null))
						}
						description={editingProgram?.description ?? ''}
						setDescription={(description) =>
							setEditingProgram((prev) =>
								prev ? { ...prev, description } : null
							)
						}
						categoryid={editingProgram?.categoryid ?? 0}
						setCategoryid={(categoryid) =>
							setEditingProgram((prev) =>
								prev ? { ...prev, categoryid } : null
							)
						}
						coverImageKey={editingProgram?.coverImageKey ?? ''}
						setCoverImageKey={(coverImageKey) =>
							setEditingProgram((prev) =>
								prev ? { ...prev, coverImageKey } : null
							)
						}
						rating={editingProgram?.rating ?? 0}
						setRating={(rating) =>
							setEditingProgram((prev) => (prev ? { ...prev, rating } : null))
						}
						subjectIds={[]}
					/>
				)}
			</div>
		</>
	);
}
