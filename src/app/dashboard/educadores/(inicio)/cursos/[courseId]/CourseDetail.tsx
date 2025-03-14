'use client';

import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';

import { LoadingCourses } from '~/app/dashboard/educadores/(inicio)/cursos/page';
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
import { toast } from '~/hooks/use-toast';

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
}
interface CourseDetailProps {
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
	const { user } = useUser();
	const router = useRouter();
	const params = useParams();
	const courseIdUrl = params?.courseId;
	const [course, setCourse] = useState<Course | null>(null);
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
	const [selectedColor, setSelectedColor] = useState<string>('');
	const predefinedColors = ['#000000', '#FFFFFF', '#1f2937']; // Colores específicos

	// Verifica que courseId no sea un array ni undefined, y lo convierte a número
	const courseIdString = Array.isArray(courseIdUrl)
		? courseIdUrl[0]
		: courseIdUrl;
	const courseIdString2 = courseIdString ?? '';
	const courseIdNumber = parseInt(courseIdString2);

	const fetchCourse = useCallback(async () => {
		if (!user) return;
		if (courseIdNumber !== null) {
			try {
				setLoading(true);
				setError(null);
				const response = await fetch(
					`/api/educadores/courses/${courseIdNumber}`
				);

				if (response.ok) {
					const data = (await response.json()) as Course;
					console.log(data);
					setCourse(data);
				} else {
					const errorData = (await response.json()) as { error?: string };
					const errorMessage = errorData.error ?? response.statusText;
					setError(`Error al cargar el curso: ${errorMessage}`);
					toast({
						title: 'Error',
						description: `No se pudo cargar el curso: ${errorMessage}`,
						variant: 'destructive',
					});
				}
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : 'Error desconocido';
				setError(`Error al cargar el curso: ${errorMessage}`);
				toast({
					title: 'Error',
					description: `No se pudo cargar el curso: ${errorMessage}`,
					variant: 'destructive',
				});
			} finally {
				setLoading(false);
			}
		}
	}, [user, courseIdNumber]);

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
		rating: number,
		requerimientos: string,
		addParametros: boolean,
		coverImageKey: string,
		fileName: string
	) => {
		try {
			let coverImageKey = course?.coverImageKey ?? '';

			if (file) {
				const uploadResponse = await fetch('/api/upload', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ contentType: file.type }),
				});

				if (!uploadResponse.ok) {
					throw new Error('Error al subir la imagen');
				}

				const uploadData = (await uploadResponse.json()) as {
					url: string;
					fields: Record<string, string>;
				};

				const { url, fields } = uploadData;
				const formData = new FormData();
				Object.entries(fields).forEach(([key, value]) =>
					formData.append(key, value)
				);
				formData.append('file', file);

				const uploadResult = await fetch(url, {
					method: 'POST',
					body: formData,
				});
				if (!uploadResult.ok) {
					throw new Error('Error al subir la imagen al servidor');
				}

				coverImageKey = fields.key ?? '';
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
						categoryid,
						modalidadesid,
						dificultadid,
						instructor: course?.instructor,
						requerimientos,
						rating,
						addParametros,
						fileName,
					}),
				}
			);

			if (!response.ok) {
				const errorData = (await response.json()) as { error?: string };
				throw new Error(errorData.error ?? 'Error al actualizar el curso');
			}

			const updatedCourse = (await response.json()) as Course;
			setCourse(updatedCourse);
			setIsModalOpen(false);
			toast({
				title: 'Curso actualizado',
				description: 'El curso se ha actualizado con éxito.',
				variant: 'destructive',
			});
		} catch (error) {
			console.error('Error:', error);
			toast({
				title: 'Error',
				description:
					error instanceof Error ? error.message : 'Error desconocido',
				variant: 'destructive',
			});
		}
	};

	if (loading) return <div>Cargando curso...</div>;
	if (error) return <div>Error: {error}</div>;
	if (!course) return <div>No se encontró el curso.</div>;

	const handlePredefinedColorChange = (color: string) => {
		setSelectedColor(color);
		localStorage.setItem(`selectedColor_${courseIdNumber}`, color);
	};

	const handleDelete = async (id: string) => {
		try {
			const response = await fetch(`/api/educadores/courses?courseId=${id}`, {
				method: 'DELETE',
			});

			if (!response.ok)
				throw new Error(`Error al eliminar el curso, id: ${id}`);
			toast({
				title: 'Curso eliminado',
				description: 'El curso se ha eliminado con éxito.',
			});
			router.push('/dashboard/educadores/cursos');
		} catch (error) {
			console.error('Error:', error);
		}
	};

	const setEditRating = (newRating: number): void => {
		setCourse((prevCourse) => {
			if (prevCourse) {
				return { ...prevCourse, rating: newRating };
			}
			return prevCourse;
		});
	};

	return (
		<div className="bg-background container h-auto w-full rounded-lg p-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink
							className="hover:text-gray-300"
							href="/dashboard/educadores"
						>
							Inicio
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="hover:text-gray-300"
							href="/dashboard/educadores/cursos"
						>
							Lista de cursos
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink className="hover:text-gray-300">
							Detalles curso {course.title}
						</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<div className="group relative h-auto w-full">
				<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-linear-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur-sm transition duration-500 group-hover:opacity-100" />
				<Card
					className={`zoom-in relative z-20 mt-3 h-auto overflow-hidden border-none bg-black p-4 text-white transition-transform duration-300 ease-in-out`}
					style={{
						backgroundColor: selectedColor,
						color: getContrastYIQ(selectedColor),
					}}
				>
					<CardHeader className="grid w-full grid-cols-2 justify-evenly md:gap-32 lg:gap-60">
						<CardTitle
							className={`text-2xl font-bold ${
								selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
							}`}
						>
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
								{predefinedColors.map((color: string) => (
									<Button
										key={color}
										style={{ backgroundColor: color }}
										className={`size-8 ${selectedColor === '#FFFFFF' ? 'border-black' : 'border-white'}`}
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
							<div className="mt-8 grid grid-cols-3 gap-5">
								<Button
									className={`border-transparent bg-green-400 text-white hover:bg-green-500`}
								>
									<Link href={`./${course.id}/ver/${course.id}`}>
										Visualizar curso
									</Link>
								</Button>
								<Button
									onClick={() => setIsModalOpen(true)}
									className={`border-yellow-500 bg-yellow-500 text-white hover:bg-yellow-600`}
								>
									Editar curso
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
												onClick={() => handleDelete(course.id.toString())}
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
							<h2
								className={`text-2xl font-bold ${
									selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
								}`}
							>
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
									<h1
										className={`mb-4 text-2xl font-bold ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
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
									<p
										className={
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}
									>
										{course.categoryid}
									</p>
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
									<p
										className={
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}
									>
										{course.instructor}
									</p>
								</div>
								<div className="flex flex-col">
									<h2
										className={`text-lg font-semibold ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Dificultad:
									</h2>
									<p
										className={
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}
									>
										{course.dificultadid}
									</p>
								</div>
								<div className="flex flex-col">
									<h2
										className={`text-lg font-semibold ${
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}`}
									>
										Modalidad:
									</h2>
									<p
										className={
											selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'
										}
									>
										{course.modalidadesid}
									</p>
								</div>
							</div>
						</div>
					</div>
				</Card>
			</div>
			{loading ? (
				<LoadingCourses />
			) : courseIdNumber !== null && courseIdNumber > 0 ? (
				<>
					<LessonsListEducator
						courseId={courseIdNumber}
						selectedColor={selectedColor}
					/>
				</>
			) : (
				<></>
			)}
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
					rating: number,
					requerimientos: string,
					addParametros: boolean,
					coverImageKey: string,
					fileName: string
				) =>
					handleUpdateCourse(
						id,
						title,
						description,
						file,
						categoryid,
						modalidadesid,
						dificultadid,
						rating,
						requerimientos,
						addParametros,
						coverImageKey,
						fileName
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
				uploading={false}
				setTitle={setEditTitle}
				setDescription={setEditDescription}
				setRequerimientos={setEditRequerimientos}
				setModalidadesid={setEditModalidad}
				setCategoryid={setEditCategory}
				setDificultadid={setEditDificultad}
				setCoverImageKey={setEditCoverImageKey}
				parametros={[]}
				setParametrosAction={(parametros: { id: number; name: string; description: string; porcentaje: number }[]) => {
					// Implement the function logic here
					console.log('Parametros updated:', parametros);
				}}
				rating={0}
				setRating={(newRating: number) => setEditRating(newRating)}
				onCloseAction={() => setIsModalOpen(false)}
			/>
		</div>
	);
};

export default CourseDetail;
