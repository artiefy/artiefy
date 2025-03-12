import { eq, inArray, and } from 'drizzle-orm';
import { db } from '~/server/db/index';
import {
	categories,
	courses,
	lessons,
	modalidades,
	users,
	activities,
	userLessonsProgress,
} from '~/server/db/schema';

export interface Lesson {
	id: number;
	title: string;
	description: string | null;
	duration: number;
	coverImageKey?: string | null;
	coverVideoKey?: string | null;
	courseId: number;
	createdAt: string | number | Date;
	updatedAt: string | number | Date;
	resourceKey?: string;
	resourceNames?: string;
	_modalidadesId: {
		id: number;
		name: string;
	};
	categoryId: {
		id: number;
		name: string;
	};
}

// Crear una nueva lección
export async function createLesson({
	title,
	description,
	duration,
	coverImageKey,
	coverVideoKey,
	courseId,
	resourceKey,
	resourceNames,
}: {
	title: string;
	description: string;
	duration: number;
	coverImageKey?: string;
	coverVideoKey?: string;
	courseId: number;
	resourceKey?: string;
	resourceNames?: string;
}) {
	try {
		const newLesson = await db.insert(lessons).values({
			title,
			description,
			duration,
			coverImageKey,
			coverVideoKey,
			courseId,
			resourceKey,
			resourceNames,
		});

		console.log('Lección creada:', newLesson);
		return newLesson;
	} catch (error) {
		console.error('Error al crear la lección:', error);
		throw error;
	}
}

// Contar el número de lecciones por curso y dificultad
// export const countLessonsByCourseAndDifficulty = async (courseId: number) => {
// 	const count = await db
// 		.select({ count: sql`COUNT(${lessons.id})` })
// 		.from(lessons)
// 		.where(eq(lessons.courseId, courseId))
// 		.then((rows) => Number(rows[0]?.count) ?? 0);

// 	return count;
// };

// Obtener la dificultad del curso
export const getCourseDifficulty = async (courseId: number) => {
	const course = await db
		.select({ dificultad: courses.dificultadid })
		.from(courses)
		.where(eq(courses.id, courseId))
		.then((rows) => rows[0]?.dificultad);

	return course;
};

// Esta función obtiene las lecciones asociadas a un curso por su ID
export async function getLessonsByCourseId(courseId: number) {
	try {
		// Filtra las lecciones por courseId y obtiene datos del curso asociado
		const lessonsData = await db
			.select({
				lessonId: lessons.id,
				lessonTitle: lessons.title,
				lessonDescription: lessons.description,
				lessonDuration: lessons.duration,
				coverImageKey: lessons.coverImageKey,
				coverVideoKey: lessons.coverVideoKey,
				resourceKey: lessons.resourceKey,
				resourceNames: lessons.resourceNames,
				createAt: lessons.createdAt,
				updateAt: lessons.updatedAt,
				courseId: lessons.courseId,
				courseTitle: courses.title,
				courseDescription: courses.description,
				courseInstructor: courses.instructor,
				courseCategories: courses.categoryid,
				courseModalidad: courses.modalidadesid,
				courseDificultad: courses.dificultadid,
			})
			.from(lessons)
			.innerJoin(courses, eq(courses.id, lessons.courseId)) // Hace el JOIN con la tabla courses
			.where(eq(lessons.courseId, courseId)); // Filtra por el courseId

		const lessonsWithCourse = lessonsData.map(
			(Lesson: {
				lessonId: number;
				lessonTitle: string;
				lessonDescription: string | null;
				lessonDuration: number;
				coverImageKey: string | null;
				coverVideoKey: string | null;
				resourceKey: string | null;
				resourceNames: string | null;
				createAt: string | number | Date;
				updateAt: string | number | Date;
				courseId: number;
				courseTitle: string;
				courseDescription: string | null;
				courseInstructor: string;
				courseCategories: number;
				courseModalidad: number;
				courseDificultad: number;
			}) => ({
				id: Lesson.lessonId,
				title: Lesson.lessonTitle,
				coverImageKey: Lesson.coverImageKey ?? '',
				coverVideoKey: Lesson.coverVideoKey ?? '',
				resourceKey: Lesson.resourceKey ?? '',
				resourceNames: Lesson.resourceNames ?? '',
				description: Lesson.lessonDescription ?? '',
				createdAt: Lesson.createAt,
				updatedAt: Lesson.updateAt,
				duration: Lesson.lessonDuration,
				course: {
					id: Lesson.courseId,
					title: Lesson.courseTitle,
					description: Lesson.courseDescription,
					instructor: Lesson.courseInstructor,
					courseCategories: Lesson.courseCategories,
					categories: Lesson.courseCategories,
					modalidad: Lesson.courseModalidad,
					dificultad: Lesson.courseDificultad,
				},
			})
		);

		return lessonsWithCourse;
	} catch (error) {
		console.error('Error al obtener las lecciones por courseId', error);
		throw error;
	}
}

// Obtener el progreso de un usuario en una lección
export const getUserProgressByLessonId = async (
	lessonId: number,
	userId: string
) => {
	const progress = await db
		.select({
			progress: userLessonsProgress.progress,
		})
		.from(userLessonsProgress)
		.where(
			and(
				eq(userLessonsProgress.lessonId, lessonId),
				eq(userLessonsProgress.userId, userId)
			)
		)
		.then((rows) => rows[0]?.progress);

	return progress;
};

// Obtener una lección por ID
export const getLessonById = async (
	lessonId: number
): Promise<Lesson | null> => {
	const lessonData = await db
		.select({
			id: lessons.id,
			title: lessons.title,
			description: lessons.description,
			duration: lessons.duration,
			coverImageKey: lessons.coverImageKey,
			coverVideoKey: lessons.coverVideoKey,
			courseId: lessons.courseId,
			createdAt: lessons.createdAt,
			updatedAt: lessons.updatedAt,
			resourceKey: lessons.resourceKey,
			resourceNames: lessons.resourceNames,
			course: {
				id: courses.id,
				title: courses.title,
				modalidadId: modalidades.name,
				categoryId: categories.name,
				description: courses.description,
				instructor: courses.instructor, // Asegúrate de que el nombre del instructor esté disponible
			},
		})
		.from(lessons)
		.leftJoin(courses, eq(lessons.courseId, courses.id))
		.leftJoin(users, eq(courses.instructor, users.id))
		.leftJoin(categories, eq(courses.categoryid, categories.id))
		.leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
		.where(eq(lessons.id, lessonId))
		.then((rows) => rows[0]);

	return (lessonData as unknown as Lesson) || null;
};

// Agregar esta interfaz si no existe
interface UpdateLessonData {
	title?: string;
	description?: string;
	duration?: number;
	coverImageKey?: string;
	coverVideoKey?: string;
	resourceKey?: string;
	resourceNames?: string;
	courseId?: number;
}

// Actualizar una lección
export const updateLesson = async (
	lessonId: number,
	data: UpdateLessonData
) => {
	const updateData: UpdateLessonData = {};

	if (data.title) updateData.title = data.title;
	if (data.description) updateData.description = data.description;
	if (typeof data.duration === 'number') updateData.duration = data.duration;
	if (data.coverImageKey) updateData.coverImageKey = data.coverImageKey;
	if (data.coverVideoKey) updateData.coverVideoKey = data.coverVideoKey;
	if (data.resourceKey) updateData.resourceKey = data.resourceKey;
	if (data.resourceNames) updateData.resourceNames = data.resourceNames;
	if (typeof data.courseId === 'number') updateData.courseId = data.courseId;

	return await db
		.update(lessons)
		.set(updateData)
		.where(eq(lessons.id, lessonId))
		.returning();
};

// Eliminar una lección por su ID y datos asociados
export const deleteLesson = async (lessonId: number): Promise<void> => {
	//Elimina las actividades asociadas a la lección
	await db.delete(activities).where(eq(activities.lessonsId, lessonId));
	await db.delete(lessons).where(eq(lessons.id, lessonId));
};

// Eliminar todas las lecciones asociadas a un curso por su ID
export const deleteLessonsByCourseId = async (courseId: number) => {
	// Obtener todas las lecciones asociadas al curso
	const lessonIds = await db
		.select({ id: lessons.id })
		.from(lessons)
		.where(eq(lessons.courseId, courseId))
		.then((rows) => rows.map((row) => row.id));

	// Eliminar el progreso de los usuarios asociado a las lecciones del curso
	await db
		.delete(userLessonsProgress)
		.where(inArray(userLessonsProgress.lessonId, lessonIds));

	// Eliminar todas las actividades asociadas a las lecciones del curso
	await db
		.delete(activities)
		.where(
			inArray(
				activities.lessonsId,
				db
					.select({ id: lessons.id })
					.from(lessons)
					.where(eq(lessons.courseId, courseId))
			)
		);
	// Elimina todas las lecciones asociadas a un curso por su ID
	await db.delete(lessons).where(eq(lessons.courseId, courseId));
};

// Obtener el progreso de los usuarios por lección
export const getUserProgressByCourseId = async (courseId: number) => {
	// Obtener todas las lecciones vinculadas al curso
	const lessonsIds = await db
		.select({ id: lessons.id })
		.from(lessons)
		.where(eq(lessons.courseId, courseId))
		.then((rows) => rows.map((row) => row.id));

	// Obtener el progreso de los usuarios para las lecciones obtenidas
	const progress = await db
		.select({
			lessonId: userLessonsProgress.lessonId,
			userId: userLessonsProgress.userId,
			progress: userLessonsProgress.progress,
		})
		.from(userLessonsProgress)
		.where(inArray(userLessonsProgress.lessonId, lessonsIds));

	// Transformar los datos en un formato más conveniente
	const progressByLesson: Record<number, Record<string, number>> = {};
	progress.forEach(({ lessonId, userId, progress }) => {
		if (!progressByLesson[lessonId]) {
			progressByLesson[lessonId] = {};
		}
		progressByLesson[lessonId][userId] = progress;
	});

	return progressByLesson;
};