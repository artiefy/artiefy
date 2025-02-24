import { eq, count } from 'drizzle-orm';
import { db } from '~/server/db/index';
import {
	courses,
	users,
	categories,
	modalidades,
	enrollments,
	dificultad,
	lessons,
} from '~/server/db/schema';
import { deleteForumByCourseId } from './forumAndPosts'; // Importar la función para eliminar foros
import { deleteLessonsByCourseId } from './lessonsModels'; // Importar la función para eliminar lecciones
import { deleteParametroByCourseId } from './parametrosModels'; // Importar la función para eliminar parámetros

export interface Lesson {
	id: number;
	title: string;
	duration: number;
	description: string | null;
	order: number;
	courseId: number;
	createdAt: string | number | Date;
	updatedAt: string | number | Date;
}

export interface Category {
	id: number;
	name: string;
	description: string | null;
}
export interface dificultad {
	id: number;
	name: string;
	description: string | null;
}

export interface Modalidad {
	id: number;
	name: string;
	description: string | null;
}

export interface Course {
	id: number;
	title: string;
	description: string;
	coverImageKey: string;
	categoryid: number | null;
	modalidadesid: number | null;
	dificultadid: number | null;
	rating: number;
	instructor: string;
	creatorId: string;
	createdAt: string | number | Date;
	updatedAt: string | number | Date;
	requerimientos: string;
}

// Crear un nuevo curso
export const createCourse = async ({
	title,
	description,
	coverImageKey,
	categoryid,
	modalidadesid,
	dificultadid,
	instructor,
	creatorId,
	requerimientos,
}: {
	title: string;
	description: string;
	coverImageKey: string;
	categoryid: number;
	modalidadesid: number;
	dificultadid: number;
	instructor: string;
	creatorId: string;
	requerimientos: string;
}) => {
	const [insertedCourse] = await db
		.insert(courses)
		.values({
			title,
			description,
			coverImageKey,
			categoryid,
			modalidadesid,
			dificultadid,
			instructor,
			creatorId,
			requerimientos,
		})
		.returning({ id: courses.id });
	return { ...insertedCourse };
};

// Obtener todos los cursos de un profesor
export const getCoursesByUserId = async (userId: string) => {
	return db
		.select({
			id: courses.id,
			title: courses.title,
			description: courses.description,
			coverImageKey: courses.coverImageKey,
			categoryid: categories.name,
			modalidadesid: modalidades.name,
			dificultadid: dificultad.name,
			instructor: courses.instructor,
			creatorId: courses.creatorId,
			createdAt: courses.createdAt,
			updatedAt: courses.updatedAt,
			requerimientos: courses.requerimientos,
		})
		.from(courses)
		.leftJoin(users, eq(courses.instructor, users.id))
		.leftJoin(categories, eq(courses.categoryid, categories.id))
		.leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
		.leftJoin(dificultad, eq(courses.dificultadid, dificultad.id))
		.where(eq(courses.creatorId, userId));
};

// Obtener el número total de estudiantes inscritos en un curso
export const getTotalStudents = async (course_id: number): Promise<number> => {
	const result = await db
		.select({ totalStudents: count() })
		.from(enrollments)
		.where(eq(enrollments.courseId, course_id));
	return result[0]?.totalStudents ?? 0;
};

export const getLessonsByCourseId = async (courseId: number) => {
	return db
		.select({
			id: lessons.id,
			title: lessons.title,
			duration: lessons.duration,
			description: lessons.description,
			courseId: lessons.courseId,
			createdAt: lessons.createdAt,
			updatedAt: lessons.updatedAt,
		})
		.from(lessons)
		.where(eq(lessons.courseId, courseId));
};

// Obtener un curso por ID
export const getCourseById = async (courseId: number) => {
	try {
		const course = await db
			.select({
				id: courses.id,
				title: courses.title,
				description: courses.description,
				coverImageKey: courses.coverImageKey,
				categoryid: courses.categoryid,
				modalidadesid: courses.modalidadesid,
				dificultadid: courses.dificultadid,
				rating: courses.rating,
				instructor: courses.instructor,
				creatorId: courses.creatorId,
				createdAt: courses.createdAt,
				updatedAt: courses.updatedAt,
				requerimientos: courses.requerimientos,
			})
			.from(courses)
			.where(eq(courses.id, courseId))
			.then((rows) => rows[0]);

		if (!course) {
			throw new Error('Curso no encontrado');
		}

		// Obtener los nombres de las relaciones por separado
		const category = course.categoryid
			? await db
					.select({ name: categories.name })
					.from(categories)
					.where(eq(categories.id, course.categoryid))
					.then((rows) => rows[0])
			: null;

		const modalidad = course.modalidadesid
			? await db
					.select({ name: modalidades.name })
					.from(modalidades)
					.where(eq(modalidades.id, course.modalidadesid))
					.then((rows) => rows[0])
			: null;

		const dificultadNivel = course.dificultadid
			? await db
					.select({ name: dificultad.name })
					.from(dificultad)
					.where(eq(dificultad.id, course.dificultadid))
					.then((rows) => rows[0])
			: null;

		const totalStudents = await getTotalStudents(courseId);

		return {
			...course,
			categoryid: category?.name ?? course.categoryid,
			modalidadesid: modalidad?.name ?? course.modalidadesid,
			dificultadid: dificultadNivel?.name ?? course.dificultadid,
			totalStudents,
		};
	} catch (error) {
		console.error('Error al obtener el curso:', error);
		throw new Error('Error al obtener el curso');
	}
};

// Obtener todos los cursos
export const getAllCourses = async () => {
	return db
		.select({
			id: courses.id,
			title: courses.title,
			description: courses.description,
			coverImageKey: courses.coverImageKey,
			categoryid: categories.name,
			modalidadesid: modalidades.name,
			dificultadid: dificultad.name,
			instructor: courses.instructor,
			creatorId: courses.creatorId,
			createdAt: courses.createdAt,
			updatedAt: courses.updatedAt,
			requerimientos: courses.requerimientos,
		})
		.from(courses)
		.leftJoin(categories, eq(courses.categoryid, categories.id))
		.leftJoin(dificultad, eq(courses.dificultadid, dificultad.id))
		.leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id));
};

// Actualizar un curso
export const updateCourse = async (
	courseId: number,
	{
		title,
		description,
		coverImageKey,
		categoryid,
		modalidadesid,
		dificultadid,
		instructor,
		requerimientos,
	}: {
		title?: string;
		description?: string | null;
		coverImageKey?: string | null;
		categoryid?: number | null;
		modalidadesid?: number | null;
		dificultadid?: number | null;
		instructor?: string;
		requerimientos?: string;
	}
) => {
	// Obtener los datos actuales del curso
	const currentCourse = await getCourseById(courseId);

	const updateData: {
		title?: string;
		description?: string | null;
		coverImageKey?: string | null;
		categoryid?: number | undefined;
		modalidadesid?: number | undefined;
		dificultadid?: number | undefined;
		instructor?: string;
		requerimientos?: string;
	} = {
		title: title ?? currentCourse.title,
		description: description ?? currentCourse.description,
		coverImageKey: coverImageKey ?? currentCourse.coverImageKey,
		categoryid:
			typeof categoryid === 'number'
				? categoryid
				: typeof currentCourse.categoryid === 'number'
					? currentCourse.categoryid
					: undefined,
		modalidadesid:
			typeof modalidadesid === 'number'
				? modalidadesid
				: typeof currentCourse.modalidadesid === 'number'
					? currentCourse.modalidadesid
					: undefined,
		dificultadid:
			typeof dificultadid === 'number'
				? dificultadid
				: typeof currentCourse.dificultadid === 'number'
					? currentCourse.dificultadid
					: undefined,
		instructor: instructor ?? currentCourse.instructor,
		requerimientos: requerimientos ?? currentCourse.requerimientos,
	};

	return db.update(courses).set(updateData).where(eq(courses.id, courseId));
};

// Eliminar un curso y su foro asociado
export const deleteCourse = async (courseId: number) => {
	// Primero elimina las inscripciones asociadas al curso
	await db.delete(enrollments).where(eq(enrollments.courseId, courseId));
	// Luego elimina los parámetros asociados al curso
	await deleteParametroByCourseId(courseId);
	// Luego elimina el foro asociado al curso
	await deleteForumByCourseId(courseId);
	// Luego elimina las lecciones asociadas al curso
	await deleteLessonsByCourseId(courseId);
	// Finalmente, elimina el curso
	return db.delete(courses).where(eq(courses.id, courseId));
};
