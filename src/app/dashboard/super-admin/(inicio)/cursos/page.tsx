'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { FiPlus } from 'react-icons/fi';

import {
	getCourses,
	createCourse,
	updateCourse,
} from '~/server/queries/queries';
import type { CourseData } from '~/server/queries/queries';
import CourseListAdmin from './../../components/CourseListAdmin';
import { SkeletonCard } from '~/components/super-admin/layout/SkeletonCard';
import ModalFormCourse from '~/components/super-admin/modals/ModalFormCourse';
import SuperAdminLayout from './../../super-admin-layout'; // ✅ Asegura que estás importando el layout correcto

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
	const [courses, setCourses] = useState<
		{
			id: number;
			title: string;
			description: string | null;
			coverImageKey: string | null;
			categoryid: number;
			instructor: string;
			createdAt: Date;
			updatedAt: Date;
			creatorId: string;
			rating: number | null;
			modalidadesid: number;
			dificultadid: number;
			requerimientos: string;
		}[]
	>([]);
	const [editingCourse, setEditingCourse] = useState<{
		id: number;
		title: string;
		description: string | null;
		coverImageKey: string | null;
		categoryid: number;
		instructor: string;
		createdAt: Date;
		updatedAt: Date;
		creatorId: string;
		rating: number | null;
		modalidadesid: number;
		dificultadid: number;
		requerimientos: string;
	} | null>(null);
	const [uploading, setUploading] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// ✅ Cargar cursos al cargar la página
	useEffect(() => {
		async function fetchCourses() {
			try {
				const coursesData = await getCourses();
				setCourses(coursesData);
			} catch (error) {
				console.error('Error cargando cursos:', error);
			}
		}
		fetchCourses().catch((error: Error) =>
			console.error('Error cargando cursos:', error)
		);
	}, []);

	// ✅ Crear o actualizar curso
	const handleCreateOrUpdateCourse = async (
		id: number,
		title: string,
		description: string | null,
		file: File | null,
		categoryid: number,
		modalidadesid: number,
		dificultadid: number,
		requerimientos: string
	) => {
		try {
			setUploading(true);
			let coverImageKey = '';

			if (file) {
				const uploadResponse = await fetch('/api/upload', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
				});

				if (!uploadResponse.ok)
					throw new Error(
						`Error al subir imagen: ${uploadResponse.statusText}`
					);

				interface UploadResponse {
					url: string;
					fields: Record<string, string>;
				}
				const { url, fields } = (await uploadResponse.json()) as UploadResponse;
				const formData = new FormData();
				Object.entries(fields).forEach(([key, value]) =>
					formData.append(key, value)
				);
				formData.append('file', file);
				await fetch(url, { method: 'POST', body: formData });

				coverImageKey = fields.key ?? '';
			}

			const instructor =
				user?.fullName ??
				user?.emailAddresses[0]?.emailAddress ??
				'Desconocido'; // ✅ Asegurar instructor

			if (id) {
				await updateCourse(Number(id), {
					title,
					description: description ?? '',
					coverImageKey: coverImageKey ?? '',
					categoryid: Number(categoryid),
					modalidadesid: Number(modalidadesid),
					dificultadid: Number(dificultadid),
					requerimientos: requerimientos ?? '',
					instructor,
				} as CourseData);
			} else {
				await fetch('/api/courses', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						title,
						description,
						coverImageKey,
						categoryid,
						modalidadesid,
						dificultadid,
						requerimientos,
					}),
				});
			}

			setIsModalOpen(false);
			setUploading(false);
			setCourses(await getCourses());
		} catch (error) {
			console.error('Error al procesar el curso:', error);
			setUploading(false);
		}
	};

	return (
		<SuperAdminLayout>
			{' '}
			{/* ✅ Envolver dentro del layout para que el sidebar no desaparezca */}
			<div className="p-6">
				<header className="flex items-center justify-between rounded-lg bg-[#3AF4EF] to-[#01142B] p-6 text-3xl font-extrabold text-white shadow-lg">
					<h1>Gestión de Cursos</h1>
					<button
						onClick={() => setIsModalOpen(true)}
						className="flex items-center rounded-md bg-[#01142B] px-6 py-2 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-[#0097A7]"
					>
						<FiPlus className="mr-2 size-5" /> Crear curso
					</button>
				</header>

				{courses.length === 0 ? (
					<SkeletonCard />
				) : (
					<CourseListAdmin
						courses={courses}
						onEditCourse={setEditingCourse}
						onDeleteCourse={() => {}}
					/>
				)}

				{isModalOpen && (
					<ModalFormCourse
						isOpen={isModalOpen}
						onCloseAction={() => setIsModalOpen(false)}
						onSubmitAction={handleCreateOrUpdateCourse}
						uploading={uploading}
						editingCourseId={editingCourse ? editingCourse.id : null}
						title={editingCourse?.title ?? ''}
						setTitle={(title) =>
							setEditingCourse((prev) => (prev ? { ...prev, title } : null))
						}
						description={editingCourse?.description ?? ''}
						setDescription={(description) =>
							setEditingCourse((prev) =>
								prev ? { ...prev, description } : null
							)
						}
						requerimientos={editingCourse?.requerimientos ?? ''}
						setRequerimientos={(requerimientos) =>
							setEditingCourse((prev) =>
								prev ? { ...prev, requerimientos } : null
							)
						}
						categoryid={editingCourse?.categoryid ?? 1}
						setCategoryid={(categoryid) =>
							setEditingCourse((prev) =>
								prev ? { ...prev, categoryid } : null
							)
						}
						modalidadesid={editingCourse?.modalidadesid ?? 1}
						setModalidadesid={(modalidadesid) =>
							setEditingCourse((prev) =>
								prev ? { ...prev, modalidadesid } : null
							)
						}
						dificultadid={editingCourse?.dificultadid ?? 1}
						setDificultadid={(dificultadid) =>
							setEditingCourse((prev) =>
								prev ? { ...prev, dificultadid } : null
							)
						}
						coverImageKey={editingCourse?.coverImageKey ?? ''}
						setCoverImageKey={(coverImageKey) =>
							setEditingCourse((prev) =>
								prev ? { ...prev, coverImageKey } : null
							)
						}
					/>
				)}
			</div>
		</SuperAdminLayout>
	);
}
