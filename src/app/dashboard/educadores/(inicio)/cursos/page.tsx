'use client';

import { useCallback, useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { FiPlus } from 'react-icons/fi';

import CourseListTeacher from '~/components/educators/layout/CourseListTeacher';
import { SkeletonCard } from '~/components/educators/layout/SkeletonCard';
import ModalFormCourse from '~/components/educators/modals/ModalFormCourse2';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import { Button } from '~/components/educators/ui/button';
import { toast } from '~/hooks/use-toast';

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
	totalParametros: number; // Add this line
}

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
	const [courses, setCourses] = useState<CourseModel[]>([]);
	const [editingCourse, setEditingCourse] = useState<CourseModel | null>(null);
	const [uploading, setUploading] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [parametrosList, setParametrosList] = useState<
		{
			id: number;
			name: string;
			description: string;
			porcentaje: number;
			entrega: number;
		}[]
	>([]);

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
						dificultadid: course.dificultadid ?? '', // Map it properly
						categoryid: course.categoryid, // Map categoryid properly
						modalidadesid: course.modalidadesid, // Map modalidadesid properly
					})) as CourseModel[]
				);
			} else {
				const errorData = (await response.json()) as { error?: string };
				const errorMessage = errorData.error ?? response.statusText;
				setError(`Error al cargar los cursos: ${errorMessage}`);
				toast({
					title: 'Error',
					description: `No se pudieron cargar los cursos: ${errorMessage}`,
					variant: 'destructive',
				});
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Error desconocido';
			setError(`Error al cargar los cursos: ${errorMessage}`);
			toast({
				title: 'Error',
				description: `No se pudieron cargar los cursos: ${errorMessage}`,
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	}, [user]);

	useEffect(() => {
		if (user) {
			fetchCourses().catch((error) =>
				console.error('Error fetching courses:', error)
			);
		}
	}, [user, fetchCourses]);

	const handleCreateOrEditCourse = async (
		id: string,
		title: string,
		description: string,
		file: File | null,
		categoryid: number,
		modalidadesid: number,
		dificultadid: number,
		requerimientos: string,
		options?: { signal: AbortSignal }
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
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : 'Unknown error';
			throw new Error(`Error to upload the file type ${errorMessage}`);
		}
		const response = await fetch('/api/educadores/courses', {
			...options,
			method: 'POST', // Asegúrate de usar 'POST' cuando no estás editando
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
			const responseData = (await response.json()) as { id: number };

			toast({
				title: editingCourse ? 'Curso actualizado' : 'Curso creado',
				description: editingCourse
					? 'El curso se actualizó con éxito'
					: 'El curso se creó con éxito',
			});

			// Guardar parámetros en la base de datos
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
							entrega: parametro.entrega,
							porcentaje: parametro.porcentaje,
							courseId: responseData.id, // Asegúrate de pasar el courseId aquí
						}),
					});

					if (response.ok) {
						toast({
							title: 'Parámetro creado exitosamente',
							description: 'El parámetro se ha creado exitosamente',
							variant: 'default',
						});
					} else {
						const errorData = (await response.json()) as { error: string };
						throw new Error(errorData.error);
					}
				} catch (error) {
					toast({
						title: 'Error al crear el parámetro',
						description: `Ha ocurrido un error al crear el parámetro: ${(error as Error).message}`,
						variant: 'destructive',
					});
				}
			}

			fetchCourses().catch((error) =>
				console.error('Error fetching courses:', error)
			);
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

	const handleCreateCourse = () => {
		setEditingCourse(null);
		setParametrosList([]); // Resetear la lista de parámetros al crear un nuevo curso
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingCourse(null);
		setParametrosList([]);
	};

	return (
		<>
			<main className="h-auto">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink
								className="text-primary hover:text-gray-300"
								href="../educadores"
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
				<div className="container mx-auto px-2">
					<div className="mt-2 flex justify-between">
						<h1 className="text-3xl font-bold">Panel de cursos</h1>
						<Button
							onClick={handleCreateCourse}
							className="bg-primary text-background transition-transform hover:text-primary active:scale-95"
						>
							<FiPlus className="mr-2" />
							Crear Curso
						</Button>
					</div>
					{loading ? (
						<LoadingCourses />
					) : error ? (
						<div className="mt-10 flex flex-col items-center justify-center py-10 text-center">
							<p className="text-xl text-red-600">{error}</p>
						</div>
					) : courses.length === 0 ? (
						<div className="mt-10 flex flex-col items-center justify-center py-10 text-center">
							<h2 className="mb-4 text-2xl font-bold">
								Lista de cursos creados
							</h2>
							<p className="text-xl text-gray-600">
								No hay cursos creados todavía
							</p>
							<p className="my-2 text-gray-500">
								Comienza creando tu primer curso haciendo clic en el botón
								"Crear Curso"
							</p>
							<span>&#128071;&#128071;&#128071;</span>
							<Button
								onClick={handleCreateCourse}
								className="mt-5 bg-primary text-background transition-transform hover:text-primary active:scale-95"
							>
								<FiPlus className="mr-2" />
								Crear Curso
							</Button>
						</div>
					) : (
						<>
							<h2 className="mb-4 mt-5 text-2xl font-bold">
								Lista de cursos creados
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
							setTitle={(title: string) =>
								setEditingCourse((prev) =>
									prev
										? { ...prev, title }
										: {
												id: 0,
												title,
												description: '',
												categoryid: '',
												modalidadesid: '',
												createdAt: '',
												instructor: '',
												coverImageKey: '',
												creatorId: '',
												dificultadid: '',
												requerimientos: '',
												totalParametros: 0,
											}
								)
							}
							description={editingCourse?.description ?? ''}
							setDescription={(description: string) =>
								setEditingCourse((prev) =>
									prev
										? { ...prev, description }
										: {
												id: 0,
												title: '',
												description,
												categoryid: '',
												modalidadesid: '',
												createdAt: '',
												instructor: '',
												coverImageKey: '',
												creatorId: '',
												dificultadid: '',
												requerimientos: '',
												totalParametros: 0,
											}
								)
							}
							requerimientos={editingCourse?.requerimientos ?? ''}
							setRequerimientos={(requerimientos: string) =>
								setEditingCourse((prev) =>
									prev
										? { ...prev, requerimientos }
										: {
												id: 0,
												title: '',
												description: '',
												categoryid: '',
												modalidadesid: '',
												createdAt: '',
												instructor: '',
												coverImageKey: '',
												creatorId: '',
												dificultadid: '',
												requerimientos,
												totalParametros: 0,
											}
								)
							}
							categoryid={editingCourse ? Number(editingCourse.categoryid) : 0}
							setCategoryid={(categoryid: number) =>
								setEditingCourse((prev) =>
									prev
										? { ...prev, categoryid: String(categoryid) }
										: {
												id: 0,
												title: '',
												description: '',
												categoryid: String(categoryid),
												modalidadesid: '',
												createdAt: '',
												instructor: '',
												coverImageKey: '',
												creatorId: '',
												dificultadid: '',
												requerimientos: '',
												totalParametros: 0,
											}
								)
							}
							modalidadesid={Number(editingCourse?.modalidadesid) ?? 0}
							setModalidadesid={(modalidadesid: number) =>
								setEditingCourse((prev) =>
									prev
										? { ...prev, modalidadesid: String(modalidadesid) }
										: {
												id: 0,
												title: '',
												description: '',
												categoryid: '',
												modalidadesid: String(modalidadesid),
												createdAt: '',
												instructor: '',
												coverImageKey: '',
												creatorId: '',
												dificultadid: '',
												requerimientos: '',
												totalParametros: 0,
											}
								)
							}
							dificultadid={Number(editingCourse?.dificultadid) ?? 0}
							setDificultadid={(dificultadid: number) =>
								setEditingCourse((prev) =>
									prev
										? { ...prev, dificultadid: String(dificultadid) }
										: {
												id: 0,
												title: '',
												description: '',
												categoryid: '',
												modalidadesid: '',
												createdAt: '',
												instructor: '',
												coverImageKey: '',
												creatorId: '',
												dificultadid: String(dificultadid),
												requerimientos: '',
												totalParametros: 0,
											}
								)
							}
							coverImageKey={editingCourse?.coverImageKey ?? ''}
							setCoverImageKey={(coverImageKey: string) =>
								setEditingCourse((prev) =>
									prev
										? { ...prev, coverImageKey }
										: {
												id: 0,
												title: '',
												description: '',
												categoryid: '',
												modalidadesid: '',
												createdAt: '',
												instructor: '',
												coverImageKey,
												creatorId: '',
												dificultadid: '',
												requerimientos: '',
												totalParametros: 0,
											}
								)
							}
							parametros={parametrosList.map((parametro, index) => ({
								...parametro,
								id: index,
							}))}
							setParametrosAction={setParametrosList}
							isOpen={isModalOpen}
							onCloseAction={handleCloseModal}
						/>
					)}
				</div>
			</main>
		</>
	);
}
