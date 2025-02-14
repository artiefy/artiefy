'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { FiPlus } from 'react-icons/fi';

import { SkeletonCard } from '~/components/super-admin/layout/SkeletonCard';
import ModalFormCourse from '~/components/super-admin/modals/ModalFormCourse';
import {
	getCourses,
	createCourse,
	updateCourse,
} from '~/server/queries/queries';
import type { CourseData } from '~/server/queries/queries';
import CourseListAdmin from './../../components/CourseListAdmin';
import SuperAdminLayout from './../../super-admin-layout';

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

	// ✅ Obtener cursos, totales y categorías
	useEffect(() => {
		async function fetchData() {
			try {
				const coursesData = await getCourses();
				setCourses(coursesData);

				// Obtener métricas
				const totalsResponse = await fetch('/api/super-admin/courses/totals');
				if (!totalsResponse.ok) throw new Error('Error obteniendo totales');
				const { totalCourses, totalStudents } = await totalsResponse.json();

				setTotalCourses(totalCourses);
				setTotalStudents(totalStudents);

				// Obtener categorías
				const categoriesResponse = await fetch('/api/super-admin/categories');
				if (!categoriesResponse.ok)
					throw new Error('Error obteniendo categorías');
				const categoriesData = await categoriesResponse.json();
				setCategories(categoriesData);
			} catch (error) {
				console.error('❌ Error cargando datos:', error);
			}
		}
		fetchData();
	}, []);

	// ✅ Filtrar cursos por búsqueda y categoría
	const filteredCourses = courses.filter(
		(course) =>
			course.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
			(categoryFilter ? course.categoryid === Number(categoryFilter) : true)
	);

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

				const { url, fields } = (await uploadResponse.json()) as {
					url: string;
					fields: Record<string, string>;
				};
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
				'Desconocido';

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
			console.error('❌ Error al procesar el curso:', error);
			setUploading(false);
		}
	};

	return (
		<SuperAdminLayout>
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
						className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>

					<button
						onClick={() => setIsModalOpen(true)}
						className="rounded-md bg-[#01142B] px-6 py-2 font-bold text-white shadow-lg hover:bg-[#0097A7]"
					>
						<FiPlus className="mr-2 size-5" /> Agregar Curso
					</button>
				</div>

				<CourseListAdmin
					courses={filteredCourses}
					onEditCourse={setEditingCourse}
					onDeleteCourse={() => {}}
				/>

				{isModalOpen && (
					<ModalFormCourse
						isOpen={isModalOpen}
						onCloseAction={() => setIsModalOpen(false)}
						onSubmitAction={handleCreateOrUpdateCourse}
					/>
				)}
			</div>
		</SuperAdminLayout>
	);
}
