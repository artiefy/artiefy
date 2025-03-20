'use server';

import { unstable_cache } from 'next/cache';

import { eq, desc } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	courses,
	categories,
	modalidades,
	nivel,
} from '~/server/db/schema';

const getAllCourses = unstable_cache(
	async (forceUpdate = false) => {
		try {
			let coursesData;
			if (forceUpdate) {
				// Obtener datos directamente de la base de datos
				coursesData = await db
					.select({
						id: courses.id,
						title: courses.title,
						description: courses.description,
						coverImageKey: courses.coverImageKey,
						categoryid: courses.categoryid,
						instructor: courses.instructor,
						createdAt: courses.createdAt,
						updatedAt: courses.updatedAt,
						creatorId: courses.creatorId,
						rating: courses.rating,
						modalidadesid: courses.modalidadesid,
						nivelid: courses.nivelid,
						categoryName: categories.name,
						categoryDescription: categories.description,
						modalidadName: modalidades.name,
						isFeatured: categories.is_featured,
					})
					.from(courses)
					.leftJoin(categories, eq(courses.categoryid, categories.id))
					.leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
					.leftJoin(nivel, eq(courses.nivelid, nivel.id))
					.orderBy(desc(courses.createdAt))
					.limit(100);
			} else {
				// Obtener datos de la caché
				coursesData = await db
					.select({
						id: courses.id,
						title: courses.title,
						description: courses.description,
						coverImageKey: courses.coverImageKey,
						categoryid: courses.categoryid,
						instructor: courses.instructor,
						createdAt: courses.createdAt,
						updatedAt: courses.updatedAt,
						creatorId: courses.creatorId,
						rating: courses.rating,
						modalidadesid: courses.modalidadesid,
						nivelid: courses.nivelid,
						categoryName: categories.name,
						categoryDescription: categories.description,
						modalidadName: modalidades.name,
						isFeatured: categories.is_featured,
					})
					.from(courses)
					.leftJoin(categories, eq(courses.categoryid, categories.id))
					.leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
					.leftJoin(nivel, eq(courses.nivelid, nivel.id))
					.orderBy(desc(courses.createdAt))
					.limit(100);
			}

			return coursesData.map((course) => ({
				id: course.id,
				title: course.title ?? '',
				description: course.description ?? '',
				coverImageKey: course.coverImageKey ?? '',
				categoryid: course.categoryid,
				instructor: course.instructor ?? '',
				createdAt: course.createdAt,
				updatedAt: course.updatedAt,
				creatorId: course.creatorId,
				rating: Number(course.rating ?? 0),
				modalidadesid: course.modalidadesid,
				nivelid: course.nivelid,
				totalStudents: 0,
				lessons: [],
				category: {
					id: course.categoryid,
					name: course.categoryName ?? '',
					description: course.categoryDescription ?? '',
					is_featured: course.isFeatured ?? false,
				},
				modalidad: { name: course.modalidadName ?? '' },
				isFeatured: course.isFeatured ?? false,
			}));
		} catch (error) {
			console.error('Error al obtener todos los cursos:', error);
			throw new Error(
				'Error al obtener todos los cursos: ' +
					(error instanceof Error ? error.message : String(error))
			);
		}
	},
	['all-courses'],
	{ revalidate: 3600 }
);

export { getAllCourses };

export const preloadAllCourses = async () => {
	await getAllCourses();
};
