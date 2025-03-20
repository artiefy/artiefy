'use server';

import { eq, desc, and } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	courses,
	categories,
	modalidades,
	nivel,
	courseTypes,
} from '~/server/db/schema';

import type { Course, SubscriptionLevel } from '~/types';

// Interfaces separadas
interface CourseQueryResult {
	id: number;
	title: string | null;
	description: string | null;
	coverImageKey: string | null;
	categoryid: number;
	instructor: string | null;
	createdAt: Date;
	updatedAt: Date;
	creatorId: string;
	rating: number | null;
	modalidadesid: number;
	nivelid: number;
	categoryName: string | null;
	categoryDescription: string | null;
	modalidadName: string | null;
	nivelName: string | null;
	isFeatured: boolean | null;
	courseTypeId: number | null;
	courseTypeName: string | null;
	requiredSubscriptionLevel: string | null;
	isPurchasableIndividually: boolean | null;
	price: number | null;
	requiresProgram: boolean | null;
	isActive: boolean | null;
	individualPrice: number | null;
}

// Consulta base separada
const baseCoursesQuery = {
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
	nivelName: nivel.name,
	isFeatured: categories.is_featured,
	courseTypeId: courses.courseTypeId,
	courseTypeName: courseTypes.name,
	requiredSubscriptionLevel: courseTypes.requiredSubscriptionLevel,
	isPurchasableIndividually: courseTypes.isPurchasableIndividually,
	price: courseTypes.price,
	requiresProgram: courses.requiresProgram,
	isActive: courses.isActive,
	individualPrice: courses.individualPrice,
};

// Función de transformación separada
const transformCourseData = (coursesData: CourseQueryResult[]): Course[] => {
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
		nivel: { name: course.nivelName ?? '' },
		isFeatured: course.isFeatured ?? false,
		requerimientos: [] as string[],
		courseTypeId: course.courseTypeId ?? 0, // Add this line
		courseType: course.courseTypeId
			? {
					requiredSubscriptionLevel:
						(course.requiredSubscriptionLevel as SubscriptionLevel) ?? 'none',
					isPurchasableIndividually: Boolean(course.isPurchasableIndividually),
					price: course.courseTypeId === 4 ? course.individualPrice : null,
				}
			: undefined,
		individualPrice: course.individualPrice ?? null, // Add this line if needed
		isActive: Boolean(course.isActive),
		requiresProgram: Boolean(course.requiresProgram),
	}));
};

export async function getAllCourses(): Promise<Course[]> {
	try {
		const coursesData = await db
			.select(baseCoursesQuery)
			.from(courses)
			.leftJoin(categories, eq(courses.categoryid, categories.id))
			.leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
			.leftJoin(nivel, eq(courses.nivelid, nivel.id))
			.leftJoin(courseTypes, eq(courses.courseTypeId, courseTypes.id))
			.where(
				and(eq(courses.isActive, true), eq(courses.requiresProgram, false))
			)
			.orderBy(desc(courses.createdAt))
			.limit(100);

		return transformCourseData(coursesData);
	} catch (err) {
		const error = err as Error;
		throw new Error(`Error al obtener todos los cursos: ${error.message}`);
	}
}

// Precargar datos - opcional, puedes removerlo si no lo necesitas
export async function preloadAllCourses(): Promise<void> {
	await getAllCourses();
}
