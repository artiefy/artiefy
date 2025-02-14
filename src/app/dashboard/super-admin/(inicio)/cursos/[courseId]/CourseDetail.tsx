'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
import LessonsListEducator from '~/components/super-admin/layout/LessonsListSuperAdmin';
import ModalFormCourse from '~/components/super-admin/modals/studentModal';
import { toast } from '~/hooks/use-toast';

// Agrega un estado para el modal

interface Course {
	id: number;
	title: string;
	description: string;
	categoryid: string;
	dificultadid: string;
	modalidadesid: string;
	instructor: string;
	coverImageKey: string;
	createdAt: string;
	requerimientos: string;
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
const CourseDetail = () => {
	useUser();
	const params = useParams();
	const router = useRouter();
	const courseIdUrl = params?.courseId as string | undefined;
	const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
	const [course, setCourse] = useState<Course | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedColor, setSelectedColor] = useState<string>('#000000');
	const predefinedColors = ['#000000', '#FFFFFF', '#1f2937'];
	const [educators, setEducators] = useState<{ id: string; name: string }[]>(
		[]
	);
	const [showDropdown, setShowDropdown] = useState(false);
	const [loadingEducators, setLoadingEducators] = useState(false);
	const [errorEducators, setErrorEducators] = useState<string | null>(null);
	// Estados para almacenar las opciones de selección
	const [dificultades, setDificultades] = useState<
		{ id: number; name: string }[]
	>([]);
	const [modalidades, setModalidades] = useState<
		{ id: number; name: string }[]
	>([]);
	const [categorias, setCategorias] = useState<{ id: number; name: string }[]>(
		[]
	);

	// Estados para los dropdowns
	const [showDropdownDificultad, setShowDropdownDificultad] = useState(false);
	const [showDropdownModalidad, setShowDropdownModalidad] = useState(false);
	const [showDropdownCategoria, setShowDropdownCategoria] = useState(false);

	const [isEditing, setIsEditing] = useState(false);
	const [editedTitle, setEditedTitle] = useState('');
	const [editedDescription, setEditedDescription] = useState('');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [newCoverImageKey, setNewCoverImageKey] = useState(
		course?.coverImageKey || ''
	);

	// 🔍 Validar courseId antes de convertirlo
	const courseIdNumber =
		courseIdUrl && !isNaN(Number(courseIdUrl)) ? Number(courseIdUrl) : null;

	useEffect(() => {
		async function fetchCourse() {
			if (!courseIdNumber) return;

			try {
				setLoading(true);
				const response = await fetch(
					`/api/super-admin/courses/${courseIdNumber}`
				);
				if (!response.ok) throw new Error('Curso no encontrado');
				const data = (await response.json()) as Course;
				setCourse(data);
				setEditedTitle(data.title);
				setEditedDescription(data.description);
			} catch (error) {
				console.error('Error cargando el curso:', error);
				setError('No se pudo cargar el curso.');
			} finally {
				setLoading(false);
			}
		}
		void fetchCourse();
	}, [courseIdNumber]);

	useEffect(() => {
		async function fetchEducators() {
			setLoadingEducators(true);
			setErrorEducators(null);

			console.log('📌 [FRONTEND] Solicitando educadores desde la API...');

			try {
				const response = await fetch('/api/super-admin/changeEducators');
				if (!response.ok) throw new Error('No se pudieron obtener educadores');

				interface Educator {
					id: string;
					name: string;
				}

				const data = (await response.json()) as { id: string; name: string }[];

				if (
					!Array.isArray(data) ||
					!data.every(
						(e: { id: string; name: string }) =>
							typeof e.id === 'string' && typeof e.name === 'string'
					)
				) {
					throw new Error('Respuesta de API inválida');
				}

				const educators = data as Educator[];
				setEducators(educators);

				console.log('✅ [FRONTEND] Educadores obtenidos:', data);

				setEducators(data);
			} catch (error) {
				console.error('❌ [FRONTEND] Error al cargar educadores:', error);
				setErrorEducators('No se pudieron cargar los educadores');
			} finally {
				setLoadingEducators(false);
			}
		}
		void fetchEducators();
	}, []);

	useEffect(() => {
		async function fetchOptions() {
			try {
				console.log(
					'📌 [FRONTEND] Solicitando dificultades, modalidades y categorías...'
				);
				const [dificultadesRes, modalidadesRes, categoriasRes] =
					await Promise.all([
						fetch('/api/super-admin/change-dificultad'),
						fetch('/api/super-admin/change-modalidad'),
						fetch('/api/super-admin/change-categoria'),
					]);

				if (!dificultadesRes.ok || !modalidadesRes.ok || !categoriasRes.ok)
					throw new Error('Error al cargar opciones');

				const dificultadesData = (await dificultadesRes.json()) as {
					id: number;
					name: string;
				}[];
				const modalidadesData = (await modalidadesRes.json()) as {
					id: number;
					name: string;
				}[];
				const categoriasData = (await categoriasRes.json()) as {
					id: number;
					name: string;
				}[];

				setDificultades(dificultadesData);
				setModalidades(modalidadesData);
				setCategorias(categoriasData);
			} catch (error) {
				console.error('❌ [FRONTEND] Error al cargar opciones:', error);
			}
		}

		void fetchOptions();
	}, []);

	const handleSaveChanges = async () => {
		try {
			const response = await fetch(`/api/super-admin/courses/${course.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: course.id,
					title: editedTitle,
					description: editedDescription,
					coverImageKey: newCoverImageKey || course.coverImageKey,
					categoryid: course.categoryid,
					modalidadesid: course.modalidadesid,
					dificultadid: course.dificultadid,
					instructor: course.instructor,
					requerimientos: course.requerimientos,
				}),
			});

			const responseData = await response.json(); // Obtén la respuesta en JSON

			if (!response.ok) {
				console.error('🔴 Error en la API:', responseData);
				throw new Error(responseData.error || 'Error al actualizar el curso');
			}

			toast({
				title: 'Curso actualizado',
				description: 'Los cambios fueron guardados con éxito',
			});

			setCourse((prev) =>
				prev
					? {
							...prev,
							title: editedTitle,
							description: editedDescription,
							coverImageKey: newCoverImageKey || prev.coverImageKey,
						}
					: prev
			);

			setIsEditing(false);
		} catch (error) {
			console.error('❌ Error al guardar cambios:', error);
			toast({ title: 'Error', description: 'No se pudo actualizar el curso' });
		}
	};

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setSelectedFile(file);

		try {
			const uploadResponse = await fetch('/api/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
			});

			if (!uploadResponse.ok) throw new Error('Error al obtener URL de carga');

			const { url, fields } = await uploadResponse.json();
			const formData = new FormData();

			Object.entries(fields).forEach(([key, value]) =>
				formData.append(key, value)
			);
			formData.append('file', file);

			const s3UploadResponse = await fetch(url, {
				method: 'POST',
				body: formData,
			});
			if (!s3UploadResponse.ok) throw new Error('Error al subir imagen');

			setNewCoverImageKey(fields.key);
		} catch (error) {
			console.error('❌ Error al subir imagen:', error);
		}
	};

	const handleChange = async (type: string, newValue: number) => {
		try {
			const response = await fetch(`/api/super-admin/change-${type}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ courseId: course?.id, newValue }),
			});

			if (!response.ok) throw new Error(`Error al actualizar ${type}`);

			// 🔥 Vuelve a traer los datos del curso desde la API para garantizar la actualización correcta
			const updatedResponse = await fetch(
				`/api/super-admin/courses/${course?.id}`
			);
			if (!updatedResponse.ok)
				throw new Error('Error al obtener el curso actualizado');

			const updatedCourse = (await updatedResponse.json()) as Course;
			console.log(`✅ ${type} actualizado correctamente:`, updatedCourse);

			setCourse(updatedCourse); // 🔄 Actualizar el estado con la versión correcta desde el backend

			toast({
				title: `${type.charAt(0).toUpperCase() + type.slice(1)} actualizada`,
				description: `Nuevo valor asignado.`,
			});

			// Cerrar dropdowns después de la selección
			setShowDropdownDificultad(false);
			setShowDropdownModalidad(false);
			setShowDropdownCategoria(false);
		} catch (error) {
			console.error(`❌ Error al cambiar ${type}:`, error);
		}
	};

	const handleChangeEducator = async (newInstructor: string) => {
		try {
			const response = await fetch('/api/super-admin/changeEducators', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ courseId: course?.id, newInstructor }),
			});

			if (!response.ok) throw new Error('Error al actualizar educador');

			setCourse((prev) =>
				prev ? { ...prev, instructor: newInstructor } : null
			);
			toast({
				title: 'Educador actualizado',
				description: `Nuevo educador: ${newInstructor}`,
			});
			setShowDropdown(false);
		} catch (error) {
			console.error('Error al cambiar educador:', error);
		}
	};

	useEffect(() => {
		const savedColor = localStorage.getItem(`selectedColor_${courseIdNumber}`);
		if (savedColor) setSelectedColor(savedColor);
	}, [courseIdNumber]);

	if (loading)
		return <div className="text-center text-lg">🔄 Cargando curso...</div>;
	if (error) return <div className="text-center text-red-500">{error}</div>;
	if (!course)
		return (
			<div className="text-center text-gray-500">
				❌ No se encontró el curso.
			</div>
		);

	const handleDelete = async (id: string) => {
		try {
			const response = await fetch(`/api/super-admin/courses?courseId=${id}`, {
				method: 'DELETE',
			});

			if (!response.ok)
				throw new Error(`Error al eliminar el curso, id: ${id}`);
			toast({
				title: 'Curso eliminado',
				description: 'El curso se ha eliminado con éxito.',
			});
			router.push('/dashboard/super-admin/cursos');
		} catch (error) {
			console.error('Error:', error);
		}
	};

	return (
		<div className="bg-background container h-auto w-full rounded-lg p-6">
			{/* 🔗 Navegación Breadcrumb */}
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink
							href="/dashboard/super-admin"
							className="hover:text-gray-300"
						>
							Inicio
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							href="/dashboard/super-admin/cursos"
							className="hover:text-gray-300"
						>
							Lista de cursos
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink className="hover:text-gray-300">
							Detalles del curso
						</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			{/* 📌 Imagen en forma de banner arriba */}
			<div className="relative h-60 w-full md:h-80">
				{isEditing ? (
					<div className="bg-opacity-50 absolute inset-0 flex items-center justify-center bg-black">
						<input
							type="file"
							accept="image/*"
							onChange={handleImageUpload}
							className="block w-full text-sm text-gray-300"
						/>
						{selectedFile && (
							<p className="text-sm text-green-400">
								Imagen seleccionada: {selectedFile.name}
							</p>
						)}
					</div>
				) : (
					<Image
						src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${newCoverImageKey || course.coverImageKey}`}
						alt={course.title}
						layout="fill"
						objectFit="cover"
						className="rounded-lg"
					/>
				)}
			</div>
			<Card
				className={`zoom-in relative z-20 mt-3 h-auto border-none bg-black p-4 text-white transition-transform duration-300 ease-in-out`}
				style={{
					backgroundColor: selectedColor,
					color: getContrastYIQ(selectedColor),
				}}
			>
				{/* Encabezado con selección de color */}
				<CardHeader className="grid w-full grid-cols-2 justify-evenly md:gap-32 lg:gap-60">
					<CardTitle className="text-2xl font-bold">
						Curso: {course.title}
					</CardTitle>
					<div className="ml-9 flex flex-col">
						<Label className="text-white">Seleccione un color:</Label>
						<div className="mt-2 flex space-x-2">
							{predefinedColors.map((color) => (
								<Button
									key={color}
									style={{ backgroundColor: color }}
									className="size-8 border border-white"
									onClick={() => setSelectedColor(color)}
								/>
							))}
						</div>
					</div>
				</CardHeader>

				{/* Contenido principal */}
				<div className="grid grid-cols-1 gap-6 md:grid-cols-1">
					{/* Información del curso */}
					<div className="pb-6">
						<h2
							className={`text-2xl font-bold ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'}`}
						>
							Información del curso
						</h2>
						<br />

						{/* Curso y Categoría */}
						<div className="relative grid grid-cols-3 gap-6">
							<div className="flex flex-col">
								<h2
									className={`text-lg font-semibold ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'}`}
								>
									Curso:
								</h2>
								{isEditing ? (
									<input
										type="text"
										value={editedTitle}
										onChange={(e) => setEditedTitle(e.target.value)}
										className="w-full rounded-md bg-gray-700 px-3 py-2 text-white"
									/>
								) : (
									<h1
										className={`mb-4 text-2xl font-bold ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'}`}
									>
										{course.title}
									</h1>
								)}
							</div>

							{/* Descripción */}
							<div className="mb-4">
								<h2
									className={`text-lg font-semibold ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'}`}
								>
									Descripción:
								</h2>
								{isEditing ? (
									<textarea
										value={editedDescription}
										onChange={(e) => setEditedDescription(e.target.value)}
										className="w-full rounded-md bg-gray-700 px-3 py-2 text-white"
									/>
								) : (
									<p
										className={`text-justify ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'}`}
									>
										{course.description}
									</p>
								)}
							</div>
						</div>
						<br></br>
						<br></br>
						<br></br>

						{/* Educador, Dificultad y Modalidad con Dropdowns */}
						<div className="relative grid grid-cols-4 gap-6">
							{/* Sección de Categoría con botón de cambio */}
							<div className="relative flex flex-col">
								<h2 className="text-lg font-semibold text-white">Categoría:</h2>
								<span className="text-primary font-medium">
									{categorias.find((cat) => cat.name === course.categoryid)
										?.name ?? 'No asignada'}
								</span>

								<div className="mt-2">
									<Button
										onClick={() =>
											setShowDropdownCategoria(!showDropdownCategoria)
										}
										className="bg-secondary rounded-md px-3 py-1 text-xs text-[#01142B] transition hover:bg-[#00A5C0]"
										aria-expanded={showDropdownCategoria}
									>
										Cambiar
									</Button>
								</div>

								{showDropdownCategoria && (
									<div className="absolute top-full left-0 z-50 mt-2 w-60 rounded-md border border-gray-200 bg-white shadow-lg">
										{categorias.length === 0 ? (
											<p className="p-3 text-center text-gray-500">
												Cargando...
											</p>
										) : (
											<ul className="max-h-48 overflow-auto">
												{categorias.map((categoria) => (
													<li
														key={categoria.id}
														className="cursor-pointer px-4 py-2 text-[#01142B] transition hover:bg-[#00BDD8] hover:text-white"
														onClick={() =>
															handleChange('categoria', categoria.id)
														}
													>
														{categoria.name}
													</li>
												))}
											</ul>
										)}
									</div>
								)}
							</div>
							{/* Educador con opción de cambio */}
							<div className="relative flex flex-col overflow-visible">
								<h2 className="text-lg font-semibold text-white">Educador:</h2>
								<span className="text-primary font-medium">
									{course.instructor}
								</span>

								<div className="mt-2">
									<Button
										onClick={() => setShowDropdown(!showDropdown)}
										className="bg-secondary rounded-md px-3 py-1 text-xs text-[#01142B] transition hover:bg-[#00A5C0]"
										aria-expanded={showDropdown}
									>
										Cambiar
									</Button>
								</div>

								{showDropdown && (
									<div className="absolute top-full left-0 z-50 mt-2 w-60 rounded-md border border-gray-200 bg-white shadow-lg">
										{loadingEducators ? (
											<p className="p-3 text-center text-gray-500">
												Cargando...
											</p>
										) : errorEducators ? (
											<p className="p-3 text-center text-red-500">
												{errorEducators}
											</p>
										) : (
											<ul className="max-h-48 overflow-auto">
												{educators.map((educator) => (
													<li
														key={educator.id}
														className="cursor-pointer px-4 py-2 text-[#01142B] transition hover:bg-[#00BDD8] hover:text-white"
														onClick={() => handleChangeEducator(educator.name)}
													>
														{educator.name}
													</li>
												))}
											</ul>
										)}
									</div>
								)}
							</div>

							{/* Sección de Dificultad con opción de cambio */}
							<div className="relative flex flex-col">
								<h2 className="text-lg font-semibold text-white">
									Dificultad:
								</h2>
								<span className="text-primary font-medium">
									{dificultades.find((dif) => dif.name === course.dificultadid)
										?.name ?? 'No asignada'}
								</span>

								<div className="mt-2">
									<Button
										onClick={() =>
											setShowDropdownDificultad(!showDropdownDificultad)
										}
										className="bg-secondary rounded-md px-3 py-1 text-xs text-[#01142B] transition hover:bg-[#00A5C0]"
										aria-expanded={showDropdownDificultad}
									>
										Cambiar
									</Button>
								</div>

								{showDropdownDificultad && (
									<div className="absolute top-full left-0 z-50 mt-2 w-60 rounded-md border border-gray-200 bg-white shadow-lg">
										{dificultades.length === 0 ? (
											<p className="p-3 text-center text-gray-500">
												Cargando...
											</p>
										) : (
											<ul className="max-h-48 overflow-auto">
												{dificultades.map((dif) => (
													<li
														key={dif.id}
														className="cursor-pointer px-4 py-2 text-[#01142B] transition hover:bg-[#00BDD8] hover:text-white"
														onClick={() => handleChange('dificultad', dif.id)}
													>
														{dif.name}
													</li>
												))}
											</ul>
										)}
									</div>
								)}
							</div>

							{/* Sección de Modalidad con opción de cambio */}
							<div className="relative flex flex-col">
								<h2 className="text-lg font-semibold text-white">Modalidad:</h2>
								<span className="text-primary font-medium">
									{modalidades.find((mod) => mod.name === course.modalidadesid)
										?.name ?? 'No asignada'}
								</span>

								<div className="mt-2">
									<Button
										onClick={() =>
											setShowDropdownModalidad(!showDropdownModalidad)
										}
										className="bg-secondary rounded-md px-3 py-1 text-xs text-[#01142B] transition hover:bg-[#00A5C0]"
										aria-expanded={showDropdownModalidad}
									>
										Cambiar
									</Button>
								</div>

								{showDropdownModalidad && (
									<div className="absolute top-full left-0 z-50 mt-2 w-60 rounded-md border border-gray-200 bg-white shadow-lg">
										{modalidades.length === 0 ? (
											<p className="p-3 text-center text-gray-500">
												Cargando...
											</p>
										) : (
											<ul className="max-h-48 overflow-auto">
												{modalidades.map((mod) => (
													<li
														key={mod.id}
														className="cursor-pointer px-4 py-2 text-[#01142B] transition hover:bg-[#00BDD8] hover:text-white"
														onClick={() => handleChange('modalidad', mod.id)}
													>
														{mod.name}
													</li>
												))}
											</ul>
										)}
									</div>
								)}
							</div>
						</div>
						<div className="relative grid grid-cols-1 gap-6">
							{/* Botones funcionales alineados */}
							<div className="mt-8 flex flex-wrap justify-end gap-2">
								{/* Visualizar */}

								<Button
									onClick={() => setIsEditing(!isEditing)}
									className="rounded bg-gray-600 px-2 py-1 text-xs text-white transition hover:bg-gray-700"
								>
									{isEditing ? 'Cancelar' : 'Editar'}
								</Button>

								{isEditing && (
									<Button
										onClick={handleSaveChanges}
										className="rounded bg-green-500 px-2 py-1 text-xs text-white transition hover:bg-green-600"
									>
										Guardar
									</Button>
								)}

								{/* Ver Estudiantes */}
								<Button
									onClick={() => setIsStudentsModalOpen(true)}
									className="rounded bg-indigo-500 px-2 py-1 text-xs text-white transition hover:bg-indigo-600"
								>
									Alumnos
								</Button>

								<ModalFormCourse
									isOpen={isStudentsModalOpen}
									onClose={() => setIsStudentsModalOpen(false)}
									courseId={course.id}
								/>

								{/* Eliminar */}
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button className="rounded bg-red-500 px-2 py-1 text-xs text-white transition hover:bg-red-600">
											Eliminar Curso
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
											<AlertDialogDescription>
												Esta acción no se puede deshacer. Se eliminará el curso
												<span className="font-bold"> {course.title} </span> y
												todos sus datos.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancelar</AlertDialogCancel>
											<AlertDialogAction
												onClick={() => handleDelete(course.id.toString())}
												className="rounded border-red-500 bg-red-500 px-2 py-1 text-xs text-white transition hover:border-red-600 hover:bg-transparent hover:text-red-600"
											>
												Eliminar
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</div>
					</div>
				</div>
			</Card>

			{/* 📚 Lista de Lecciones */}
			{courseIdNumber && (
				<LessonsListEducator
					courseId={courseIdNumber}
					selectedColor={selectedColor}
				/>
			)}
		</div>
	);
};

export default CourseDetail;
