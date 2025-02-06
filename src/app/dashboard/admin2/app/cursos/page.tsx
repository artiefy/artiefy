'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Users, TrendingUp, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { FiPlus } from 'react-icons/fi';
import { Button } from '~/components/admin/ui/button';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/admin/ui/card';
import { CourseDetails } from '~/components/admin/ui/CourseDetails';
import { CourseForm } from '~/components/admin/ui/Courseform';
import { DashboardMetrics } from '~/components/admin/ui/DashboardMetrics';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '~/components/admin/ui/dialog';
import { Input } from '~/components/admin/ui/input';
import ModalFormCourse from '~/components/admin/ui/ModalFormCourse';
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '~/components/admin/ui/pagination';
import { toast } from '~/hooks/use-toast';
import { type Course } from '~/types/course';

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
	dificultadid: string; // Add this line
	requerimientos: string;
}

export default function Cursos() {
	const [courses, setCourses] = useState<Course[]>([
		{
			id: 1,
			title: 'Introducción a la Programación',
			coverImageKey: null,
			category: { id: 1, name: 'Programación' },
			description: 'Un curso básico para principiantes en programación',
			instructor: 'Juan Pérez',
			rating: 4.5,
			createdAt: '2023-01-01',
			updatedAt: '2023-06-15',
			totalStudents: 100,
			modalidad: { name: 'Online' },
			lessons: [
				{
					id: 1,
					title: 'Introducción a los algoritmos',
					duration: 60,
					description: 'Conceptos básicos de algoritmos',
				},
				{
					id: 2,
					title: 'Variables y tipos de datos',
					duration: 45,
					description: 'Entendiendo las variables y tipos en programación',
				},
			],
		},
		// Añade más cursos aquí para probar la paginación
	]);

	const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const coursesPerPage = 6;
	const [totalCourses, setTotalCourses] = useState<number>(0);

	useEffect(() => {
		const fetchTotalCourses = async () => {
			try {
				const response = await fetch('/api/admin/couses');
				if (!response.ok) {
					throw new Error('Error fetching total courses');
				}
				const data: { total: number } = (await response.json()) as {
					total: number;
				};
				setTotalCourses(data.total);
			} catch (error) {
				console.error('Error fetching total courses:', error);
			}
		};

		void fetchTotalCourses();
	}, []);

	const handleAddCourse = (newCourse: Partial<Course>) => {
		const course: Course = {
			...newCourse,
			id: courses.length + 1,
			coverImageKey: null,
			rating: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			totalStudents: 0,
		} as Course;
		setCourses([...courses, course]);
	};

	const filteredCourses = courses.filter(
		(course) =>
			course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
	);
	const [uploading, setUploading] = useState(false);
	const [editingCourse, setEditingCourse] = useState<CourseModel | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { user } = useUser();
	console.log(user?.id);
	const indexOfLastCourse = currentPage * coursesPerPage;
	const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
	const currentCourses = filteredCourses.slice(
		indexOfFirstCourse,
		indexOfLastCourse
	);

	const handleCreateCourse = () => {
		setEditingCourse(null);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
	};

	const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

	const handleCreateOrEditCourse = async (
		id: string,
		title: string,
		description: string,
		file: File | null,
		categoryid: number,
		modalidadesid: number,
		dificultadid: number,
		requerimientos: string
	) => {
		if (!user) return;
		let coverImageKey = '';
		try {
			setUploading(true);
			if (file) {
				const uploadResponse = await fetch('/api/upload', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
				});

				if (!uploadResponse.ok) {
					throw new Error(
						`Error: al iniciar la carga: ${uploadResponse.statusText}`
					);
				}

				const { url, fields } = (await uploadResponse.json()) as {
					url: string;
					fields: Record<string, string>;
				};

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
				if (!uploadResponse.ok) {
					throw new Error(
						`Error: al iniciar la carga: ${uploadResponse.statusText}`
					);
				}
				coverImageKey = fields.key ?? '';
			}
			setUploading(false);
		} catch (e) {
			throw new Error(`Error to upload the file type ${(e as Error).message}`);
		}
		const response = await fetch('/api/educadores/courses', {
			method: editingCourse ? 'PUT' : 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				id: editingCourse?.id,
				title,
				description,
				coverImageKey,
				categoryid,
				modalidadesid,
				instructor: user.fullName,
				creatorId: user.id,
				dificultadid,
				requerimientos,
			}),
		});

		if (response.ok) {
			toast({
				title: editingCourse ? 'Curso actualizado' : 'Curso creado',
				description: editingCourse
					? 'El curso se actualizó con éxito'
					: 'El curso se creó con éxito',
			});
			setEditingCourse(null);
			setIsModalOpen(false);
		} else {
			const errorData = (await response.json()) as { error?: string };
			toast({
				title: 'Error',
				description:
					errorData.error ?? 'Ocurrió un error al procesar la solicitud',
				variant: 'destructive',
			});
		}
	};

	return (
		<div className="space-y-6 bg-background p-4 sm:p-6 md:p-8">
			<h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
				Gestión de Cursos
			</h2>

			<div className="grid gap-4">
				<div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Total de Cursos
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{totalCourses}</div>
							<Link
								href={'/cursos'}
								className="text-xs text-muted-foreground hover:underline"
							>
								Ver detalles
							</Link>
						</CardContent>
					</Card>

					<DashboardMetrics
						metrics={[
							{
								title: 'Estudiantes Inscritos',
								value: courses
									.reduce((acc, course) => acc + course.totalStudents, 0)
									.toString(),
								icon: Users,
								href: '/estudiantes',
							},
							{
								title: 'Promedio de Calificación',
								value: (
									courses.reduce(
										(acc, course) => acc + (course.rating ?? 0),
										0
									) / courses.length
								).toFixed(1),
								icon: TrendingUp,
								href: '/analisis',
							},
						]}
					/>
				</div>
				<Card>
					<CardHeader>
						<CardTitle className="text-lg sm:text-xl">
							Buscar y Agregar Cursos
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
						<div className="relative w-full max-w-sm">
							<Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Buscar cursos..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-8"
							/>
						</div>
						<Dialog>
							<DialogTrigger asChild>
								<Button className="w-full sm:w-auto">
									<Plus className="mr-2 size-4" /> Agregar Curso
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-[550px]">
								<DialogHeader>
									<DialogTitle>Agregar Nuevo Curso</DialogTitle>
								</DialogHeader>
								<CourseForm onSubmit={handleAddCourse} />
							</DialogContent>
						</Dialog>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
				{currentCourses.map((course) => (
					<Card key={course.id} className="flex flex-col">
						<CardHeader>
							<CardTitle className="text-lg">{course.title}</CardTitle>
						</CardHeader>
						<CardContent className="grow">
							<p className="mb-2 text-sm text-muted-foreground">
								{course.instructor}
							</p>
							<p className="line-clamp-3 text-sm">{course.description}</p>
						</CardContent>
						<CardFooter className="flex items-center justify-between">
							<span className="text-sm font-medium">
								{course.totalStudents} estudiantes
							</span>
							<Button
								variant="outline"
								onClick={() => setSelectedCourse(course)}
							>
								Ver Detalles
							</Button>
						</CardFooter>
					</Card>
				))}
			</div>
			<Button
				onClick={handleCreateCourse}
				className="bg-primary text-background transition-transform hover:text-primary active:scale-95"
			>
				<FiPlus className="mr-2" />
				Crear Curso
			</Button>
			{isModalOpen && (
				<ModalFormCourse
					onSubmitAction={handleCreateOrEditCourse}
					uploading={uploading}
					editingCourseId={editingCourse ? editingCourse.id : null}
					title={editingCourse?.title ?? ''}
					setTitle={(title: string) =>
						setEditingCourse((prev) => (prev ? { ...prev, title } : null))
					}
					description={editingCourse?.description ?? ''}
					setDescription={(description: string) =>
						setEditingCourse((prev) => (prev ? { ...prev, description } : null))
					}
					requerimientos={editingCourse?.requerimientos ?? ''}
					setRequerimientos={(requerimientos: string) =>
						setEditingCourse((prev) =>
							prev ? { ...prev, requerimientos } : null
						)
					}
					categoryid={editingCourse ? Number(editingCourse.categoryid) : 0}
					setCategoryid={(categoryid: number) =>
						setEditingCourse((prev) =>
							prev ? { ...prev, categoryid: String(categoryid) } : null
						)
					}
					modalidadesid={Number(editingCourse?.modalidadesid) ?? 0}
					setModalidadesid={(modalidadesid: number) =>
						setEditingCourse((prev) =>
							prev ? { ...prev, modalidadesid: String(modalidadesid) } : null
						)
					}
					dificultadid={Number(editingCourse?.dificultadid) ?? 0}
					setDificultadid={(dificultadid: number) =>
						setEditingCourse((prev) =>
							prev ? { ...prev, dificultadid: String(dificultadid) } : null
						)
					}
					coverImageKey={editingCourse?.coverImageKey ?? ''}
					setCoverImageKey={(coverImageKey: string) =>
						setEditingCourse((prev) =>
							prev ? { ...prev, coverImageKey } : null
						)
					}
					isOpen={isModalOpen}
					onCloseAction={handleCloseModal}
				/>
			)}

			<div className="mt-6 flex justify-center">
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious onClick={() => paginate(currentPage - 1)} />
						</PaginationItem>
						{Array.from(
							{ length: Math.ceil(filteredCourses.length / coursesPerPage) },
							(_, index) => (
								<PaginationItem key={index}>
									<PaginationLink
										onClick={() => paginate(index + 1)}
										isActive={index + 1 === currentPage}
									>
										{index + 1}
									</PaginationLink>
								</PaginationItem>
							)
						)}
						<PaginationItem>
							<PaginationNext onClick={() => paginate(currentPage + 1)} />
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</div>

			{selectedCourse && (
				<Dialog
					open={!!selectedCourse}
					onOpenChange={() => setSelectedCourse(null)}
				>
					<DialogContent className="h-[90vh] w-full p-0 sm:max-w-[425px] md:max-w-[700px] lg:max-w-[900px]">
						<CourseDetails course={selectedCourse} />
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
