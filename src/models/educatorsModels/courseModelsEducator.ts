import { eq, count, sum } from 'drizzle-orm';

import { db } from '~/server/db/index';
import {
	courses,
	users,
	categories,
	modalidades,
	enrollments,
	nivel,
	lessons,
	materias, courseTypes
} from '~/server/db/schema';

import { deleteForumByCourseId } from './forumAndPosts'; // Importar la función para eliminar foros
import { deleteLessonsByCourseId } from './lessonsModels'; // Importar la función para eliminar lecciones
import { deleteParametroByCourseId } from './parametrosModels'; // Importar la función para eliminar parámetros

export interface Lesson {
	id: number;
	title: string;
	duration: number;
	description: string | null;
	courseId: number;
	createdAt: string | number | Date;
	updatedAt: string | number | Date;
}

export interface Category {
	id: number;
	name: string;
	description: string | null;
}
export interface Nivel {
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
	nivelid: number | null;
	rating: number;
	instructor: string;
	creatorId: string;
	createdAt: string | number | Date;
	updatedAt: string | number | Date;
}

// CRUD de cursos
// Crear un nuevo curso
export const createCourse = async ({
	title,
	description,
	coverImageKey,
	categoryid,
	modalidadesid,
	nivelid,
	instructor,
	creatorId,
	rating,
	courseTypeId,
	isActive,
}: {
	title: string;
	description: string;
	coverImageKey: string;
	categoryid: number;
	modalidadesid: number;
	nivelid: number;
	instructor: string;
	creatorId: string;
	rating: number;
	courseTypeId: number; 
	isActive?: boolean; 
}) => {
	const [insertedCourse] = await db
		.insert(courses)
		.values({
			title,
			description,
			coverImageKey,
			categoryid,
			modalidadesid,
			nivelid,
			instructor,
			rating,
			creatorId,
			courseTypeId, isActive
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
			nivelid: nivel.name,
			instructor: courses.instructor,
			rating: courses.rating,
			creatorId: courses.creatorId,
			createdAt: courses.createdAt,
			updatedAt: courses.updatedAt,
		})
		.from(courses)
		.leftJoin(users, eq(courses.instructor, users.id))
		.leftJoin(categories, eq(courses.categoryid, categories.id))
		.leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
		.leftJoin(nivel, eq(courses.nivelid, nivel.id))
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

// Obtener todas las lecciones de un curso
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

//obtener duracion total de todas las clases por courseId
export const getTotalDuration = async (courseId: number) => {
	const result = await db
		.select({ totalDuration: sum(lessons.duration) })
		.from(lessons)
		.where(eq(lessons.courseId, courseId));
	return result[0]?.totalDuration ?? 0;
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
				nivelid: courses.nivelid,
				rating: courses.rating,
				instructor: courses.instructor,
				creatorId: courses.creatorId,
				createdAt: courses.createdAt,
				updatedAt: courses.updatedAt,
				courseTypeId: courses.courseTypeId,
				isActive: courses.isActive,
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

		const nivelName = course.nivelid
			? await db
					.select({ name: nivel.name })
					.from(nivel)
					.where(eq(nivel.id, course.nivelid))
					.then((rows) => rows[0]?.name ?? null)
			: null;
		const courseTypeName = course.courseTypeId
			? await db
					.select({ name: courseTypes.name })
					.from(courseTypes)
					.where(eq(courseTypes.id, course.courseTypeId))
					.then((rows) => rows[0]?.name ?? null)
			: null;
		
		const totalStudents = await getTotalStudents(courseId);

		return {
			...course,
			categoryid: category?.name ?? course.categoryid,
			modalidadesid: modalidad?.name ?? course.modalidadesid,
			nivelid: nivelName ?? course.nivelid,
			courseTypeName, 
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
			nivelid: nivel.name,
			instructor: courses.instructor,
			creatorId: courses.creatorId,
			createdAt: courses.createdAt,
			updatedAt: courses.updatedAt,
			isActive: courses.isActive,
		})
		.from(courses)
		.leftJoin(categories, eq(courses.categoryid, categories.id))
		.leftJoin(nivel, eq(courses.nivelid, nivel.id))
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
		nivelid,
		instructor,	
		fileName,
		rating,
		courseTypeId, isActive
	}: {
		title?: string;
		description?: string | null;
		coverImageKey?: string | null;
		categoryid?: number | null;
		modalidadesid?: number | null;
		nivelid?: number | null;
		instructor?: string;
		fileName?: string;
		rating?: number;
		courseTypeId?: number | null;
		isActive?: boolean| null;
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
		nivelid?: number | undefined;
		instructor?: string;
		fileName?: string;
		rating?: number;
		courseTypeId?: number | null;
		isActive?: boolean | null;
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
		nivelid:
			typeof nivelid === 'number'
				? nivelid
				: typeof currentCourse.nivelid === 'number'
					? currentCourse.nivelid
					: undefined,
		instructor: instructor ?? currentCourse.instructor,
		// fileName is not part of currentCourse, so it is removed
		rating: rating ?? currentCourse.rating ?? undefined,
		courseTypeId:
			typeof courseTypeId === 'number' ? courseTypeId : currentCourse.courseTypeId,
			isActive: typeof isActive === 'boolean' ? isActive : currentCourse.isActive, 
	};

	return db.update(courses).set({
		...updateData,
		courseTypeId: updateData.courseTypeId ?? undefined, // Ensure compatibility
	}).where(eq(courses.id, courseId));
};

export async function updateMateria(
	id: number,
	data: { courseid: number; title?: string; description?: string }
) {
	try {
		// Buscar la materia por su ID
		const existingMateria = await db
			.select()
			.from(materias)
			.where(eq(materias.id, id))
			.limit(1);
	
		if (existingMateria.length > 0) {
			const materia = existingMateria[0];
	
			if (materia.courseid) {
				// Si la materia ya tiene un `courseid`, crear una nueva materia con los mismos datos
				await db.insert(materias).values({
					title: materia.title, // Copiar el título de la materia existente
					description: materia.description ?? '', // Copiar la descripción si existe
					courseid: data.courseid, // Asociar al nuevo curso
					programaId: materia.programaId ?? 0, // Asegurar que programaId esté presente
				});
				console.log(
					`Materia duplicada creada: ${materia.title} -> courseId: ${data.courseid}`
				);
			} else {
				// Si la materia no tiene un `courseid`, actualizarla
				await db
					.update(materias)
					.set({ courseid: data.courseid })
					.where(eq(materias.id, id));
				console.log(
					`Materia actualizada: ${materia.title} -> courseId: ${data.courseid}`
				);
			}
			
		}
	} catch (error) {
		console.error('Error al procesar materia:', error);
		throw new Error('Error al procesar la materia');
	}
}

// Eliminar un curso y sus datos asociado
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

// Obtener los cursos en los que el usuario está inscrito
export const getCoursesByUserIdSimplified = async (userId: string) => {
	console.log('UserId recibido:', userId); // Verifica que el ID sea correcto

	try {
		// Realiza la consulta para obtener los cursos en los que el usuario está inscrito
		const coursesData = await db
			.select({
				id: courses.id,
				title: courses.title,
				description: courses.description,
				coverImageKey: courses.coverImageKey, // Asegúrate de que este campo existe
			})
			.from(courses)
			.innerJoin(enrollments, eq(enrollments.courseId, courses.id)) // Realiza el join con la tabla de enrollments
			.where(eq(enrollments.userId, userId)); // Filtra por el userId en la tabla de enrollments

		// Verifica los datos obtenidos de la consulta
		console.log('Cursos obtenidos:', coursesData);

		// Si no se obtienen cursos, retornar un array vacío
		if (coursesData.length === 0) {
			console.log('No se encontraron cursos para el usuario');
			return [];
		}

		// De lo contrario, devolver los cursos
		return coursesData;
	} catch (error) {
		console.error('Error al obtener los cursos:', error);
		throw new Error('Error al obtener los cursos');
	}
};

// Función para obtener materias por el ID del curso
export const getMateriasByCourseId = async (courseId: number) => {
	try {
		// Realiza la consulta para obtener las materias relacionadas con el curso
		const materiasList = await db
			.select({
				id: materias.id,
				title: materias.title,
				description: materias.description,
				programaId: materias.programaId,
				courseid: materias.courseid,
			})
			.from(materias)
			.where(eq(materias.courseid, courseId))
			.execute();

		return materiasList;
	} catch (error) {
		console.error('Error fetching materias for courseId:', courseId, error);
		throw new Error('Failed to fetch materias');
	}
};


export const getModalidadById = async (modalidadId: number) => {
    return db
        .select({
            id: modalidades.id,
            name: modalidades.name,
            description: modalidades.description,
        })
        .from(modalidades)
        .where(eq(modalidades.id, modalidadId))
        .then((rows) => rows[0]);
};

