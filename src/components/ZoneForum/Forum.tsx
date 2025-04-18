'use client';
import { useState, useEffect } from 'react';

import { useUser } from '@clerk/nextjs'; // Importa el hook de Clerk
import { FaSearch, FaPlus } from 'react-icons/fa';
import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button'; // Importa el botón de ShadCN
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '~/components/educators/ui/dialog'; // Componente de modal
import { Input } from '~/components/educators/ui/input'; // Componente Input de ShadCN
import { Progress } from '~/components/educators/ui/progress';
import { Zone } from '~/components/ZoneForum/Zone'; // Componente Zone

// Interfaz para los modelos de cursos
interface CoursesModels {
	id: number;
	title: string;
	description: string;
	coverImageKey: string;
}

const ForumHome = () => {
	const { user } = useUser(); // Obtiene el usuario actual
	const [searchQuery, setSearchQuery] = useState(''); // Estado para la consulta de búsqueda
	const [courseId, setCourseId] = useState<number | ''>(''); // Estado para el ID del curso
	const [title, setTitle] = useState(''); // Estado para el título del foro
	const [description, setDescription] = useState(''); // Estado para la descripción del foro
	const [courses, setCourses] = useState<CoursesModels[]>([]); // Estado para la lista de cursos
	const [loadingCourses, setLoadingCourses] = useState(false); // Estado para la carga de cursos
	const [isUploading, setIsUploading] = useState(false); // Estado para la subida de datos
	const [uploadProgress, setUploadProgress] = useState(0); // Estado para el progreso de subida
	const [isDialogOpen, setIsDialogOpen] = useState(false); // Estado para el diálogo modal

	// Maneja la creación del foro
	const handleCreateForum = async () => {
		if (!user) return null;
		setIsUploading(true);
		const userId = user.id;
		try {
			// Petición POST al servidor para crear el foro
			const response = await fetch('/api/forums', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ courseId, title, description, userId }),
			});
			interface ResponseData {
				success: boolean;
				forumId: number;
			}
			setUploadProgress(100); // Actualizamos el progreso al 100%
			const data: ResponseData = (await response.json()) as ResponseData;
			toast.success('Foro creado exitosamente!.', {
				description: `El foro se ha creado satisfactoriamente:`,
			});
			console.log(data);
			setIsDialogOpen(false); // Cerrar el Dialog
			window.location.reload(); // Refrescar la página
		} catch (error) {
			console.error('Error al crear el foro:', error);
		}
		// Resetear los campos
		setCourseId('');
		setTitle('');
		setDescription('');
	};

	// Efecto para obtener los cursos del usuario
	useEffect(() => {
		const fetchCourses = async () => {
			try {
				if (!user) return null;
				setLoadingCourses(true);
				const response = await fetch(
					`/api/educadores/courses?userId=${user.id}`
				);
				if (!response.ok) {
					const errorData = (await response.json()) as { error?: string };
					throw new Error(errorData.error ?? 'Error al obtener los cursos');
				}
				const data = (await response.json()) as CoursesModels[];
				setCourses(data); // Setea las lecciones obtenidas
			} catch (error) {
				console.error('Error al obtener los cursos:', error);
			} finally {
				setLoadingCourses(false);
			}
		};

		void fetchCourses();
	}, [user]);

	// Renderiza la vista
	return (
		<div className="min-h-screen bg-background p-4 sm:px-6 lg:px-4">
			<div className="mx-auto max-w-7xl">
				<div className="mb-8">
					<div className="mb-4 flex items-center justify-between">
						<h1 className="text-3xl font-bold text-primary">
							Zona de foros Artiefy
						</h1>
						{/* Botón para abrir el modal de creación de foro */}
						<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
							<DialogTrigger asChild>
								<Button
									className="flex items-center gap-2 bg-primary text-black hover:bg-primary/90"
									onClick={() => setIsDialogOpen(true)}
								>
									<FaPlus />
									Crear Foro
								</Button>
							</DialogTrigger>

							<DialogContent>
								<DialogHeader>
									<DialogTitle>Crear Foro</DialogTitle>
									<DialogDescription>
										Rellena los campos para crear un nuevo foro.
									</DialogDescription>
								</DialogHeader>

								{/* Formulario para crear un foro */}
								<div className="flex flex-col space-y-4">
									<label
										htmlFor="category-select"
										className="text-lg font-medium text-primary"
									>
										Selecciona un curso para crear el foro:
									</label>
									{loadingCourses ? (
										<p className="text-primary">
											Cargando cursos del usuario...
										</p>
									) : (
										<select
											id="id Curso"
											value={courseId}
											onChange={(e) => {
												const selectedId = Number(e.target.value);
												setCourseId(selectedId);
											}}
											className={`mb-5 w-80 rounded border border-white bg-transparent p-2 text-gray-500 outline-none`}
										>
											<option className="bg-background" value="">
												Selecciona un curso para el foro
											</option>
											{courses.map((curso) => (
												<option
													key={curso.id}
													value={curso.id}
													className="bg-background"
												>
													{curso.title}
												</option>
											))}
										</select>
									)}
									<Input
										type="text"
										placeholder="Título del foro"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										className="w-full text-gray-500"
									/>
									<Input
										type="text"
										placeholder="Descripción del foro"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										className="w-full text-gray-500"
									/>

									<div className="mb-4 w-full rounded border border-primary p-1">
										<h3 className="text-lg font-medium text-primary">
											Instructor: {user?.fullName}
										</h3>
									</div>
								</div>
								{isUploading && (
									<div className="mt-4">
										<Progress value={uploadProgress} className="w-full" />
										<p className="mt-2 text-center text-sm text-gray-500">
											{uploadProgress}% Completado
										</p>
									</div>
								)}
								<DialogFooter>
									<Button
										className="border border-primary-foreground bg-transparent hover:bg-gray-700/10"
										onClick={() => {
											setCourseId('');
											setTitle('');
											setDescription('');
											setIsDialogOpen(false); // Cerrar el diálogo
										}}
									>
										Cancelar
									</Button>
									<Button
										onClick={handleCreateForum}
										className="border-none bg-green-500 text-white hover:bg-green-500/80"
									>
										Crear Foro
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
					<div className="relative">
						<Input
							type="text"
							placeholder="Buscar una discusion..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-white focus:ring-2 focus:ring-white focus:outline-none"
						/>
						<FaSearch className="absolute top-3 left-3 text-gray-400" />
					</div>
				</div>
				{/* Zona para mostrar la lista de foros */}
				<div>
					<Zone />
				</div>
			</div>
		</div>
	);
};

export default ForumHome;
