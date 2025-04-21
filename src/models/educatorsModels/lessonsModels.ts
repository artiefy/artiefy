import { clerkClient } from '@clerk/nextjs/server';
import { eq, inArray, and, desc, lt } from 'drizzle-orm';

import { db } from '~/server/db/index';
import {
	categories,
	courses,
	lessons,
	modalidades,
	users,
	activities,
	userLessonsProgress,
	userActivitiesProgress,
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
}): Promise<{ id: number }> {
	try {
		// 1. Crear la nueva lección primero
		const [newLesson] = await db
			.insert(lessons)
			.values({
				title,
				description: description ?? '',
				duration,
				coverImageKey: coverImageKey ?? '',
				coverVideoKey: coverVideoKey ?? '',
				courseId,
				resourceKey: resourceKey ?? '',
				resourceNames: resourceNames ?? '',
			})
			.returning({ id: lessons.id });

		// 2. Buscar la lección anterior (la última creada antes de esta)
		const previousLesson = await db
			.select()
			.from(lessons)
			.where(and(eq(lessons.courseId, courseId), lt(lessons.id, newLesson.id)))
			.orderBy(desc(lessons.id))
			.limit(1);

		if (previousLesson.length > 0) {
			const previousLessonId = previousLesson[0].id;

			// 3. Obtener todos los progresos de los usuarios en esa lección
			const userProgressData = await db
				.select()
				.from(userLessonsProgress)
				.where(eq(userLessonsProgress.lessonId, previousLessonId));

			for (const progress of userProgressData) {
				let unlockNextLesson = false;

				// 4. Verificar si la clase anterior tenía actividades
				const lessonActivities = await db
					.select()
					.from(activities)
					.where(eq(activities.lessonsId, previousLessonId));

				if (lessonActivities.length === 0) {
					// Sin actividades: desbloquear si video >= 100%
					unlockNextLesson = progress.progress >= 100;
				} else {
					// Con actividades: desbloquear si TODAS están completas
					const activityIds = lessonActivities.map((a) => a.id);

					const userActivityProgress = await db
						.select()
						.from(userActivitiesProgress)
						.where(
							and(
								inArray(userActivitiesProgress.activityId, activityIds),
								eq(userActivitiesProgress.userId, progress.userId)
							)
						);

					unlockNextLesson =
						userActivityProgress.length === activityIds.length &&
						userActivityProgress.every((a) => a.isCompleted);
				}

				// 5. Crear el progreso para la nueva lección para este usuario
				await db.insert(userLessonsProgress).values({
					userId: progress.userId,
					lessonId: newLesson.id,
					isLocked: !unlockNextLesson,
					isNew: unlockNextLesson,
				});
			}
		}

		console.log('✅ Lección creada:', newLesson);
		return newLesson;
	} catch (_error) {
		console.error('❌ Error al crear la lección:', _error);
		throw _error;
	}
}

// Obtener la  del curso
export const getCourseDifficulty = async (courseId: number) => {
	const course = await db
		.select({ nivel: courses.nivelid })
		.from(courses)
		.where(eq(courses.id, courseId))
		.then((rows) => rows[0]?.nivel);

	return course;
};
// Esta función obtiene las lecciones asociadas a un curso por su ID
export async function getLessonsByCourseId(courseId: number) {
	try {
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
				courseNivel: courses.nivelid,
			})
			.from(lessons)
			.innerJoin(courses, eq(courses.id, lessons.courseId))
			.where(eq(lessons.courseId, courseId));

		if (!lessonsData || lessonsData.length === 0) {
			return [];
		}

		const clerk = await clerkClient();
		let fullname = '';
		const instructorId = lessonsData[0].courseInstructor;

		console.log('Intentando obtener instructor:', instructorId);

		try {
			try {
				const clerkUser = await clerk.users.getUser(instructorId);
				fullname =
					`${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim();
			} catch (_error) {
				console.log(
					'Instructor no encontrado en Clerk, buscando en base de datos...'
				);
				// Buscar en la base de datos
				const dbUser = await db
					.select({
						name: users.name,
					})
					.from(users)
					.where(eq(users.id, instructorId))
					.then((rows) => rows[0]);

				if (dbUser?.name) {
					fullname = dbUser.name;
				} else {
					console.error('Instructor no encontrado en la base de datos');
					fullname = 'Instructor no encontrado';
				}
			}
		} catch (_error) {
			console.error('Error al obtener datos del instructor:', _error);
			fullname = 'Instructor no encontrado';
		}

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
				courseNivel: number;
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
					instructor: fullname || 'Instructor no disponible',
					courseCategories: Lesson.courseCategories,
					categories: Lesson.courseCategories,
					modalidad: Lesson.courseModalidad,
					nivel: Lesson.courseNivel,
				},
			})
		);

		return lessonsWithCourse;
	} catch (_error) {
		console.error('Error al obtener las lecciones:', _error);
		throw new Error('No se pudieron cargar las lecciones del curso');
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
	try {
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
					instructor: courses.instructor,
				},
			})
			.from(lessons)
			.leftJoin(courses, eq(lessons.courseId, courses.id))
			.leftJoin(users, eq(courses.instructor, users.id))
			.leftJoin(categories, eq(courses.categoryid, categories.id))
			.leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
			.where(eq(lessons.id, lessonId))
			.then((rows) => rows[0]);

		if (!lessonData) {
			return null;
		}

		const clerk = await clerkClient();
		let instructorName = '';
		const instructorId = lessonData.course.instructor;

		console.log('Datos del instructor en getLessonById:', {
			lessonId,
			instructorId,
			courseTitle: lessonData.course.title,
		});

		try {
			if (!instructorId) {
				console.log('ID del instructor no encontrado en la base de datos');
				instructorName = 'Instructor no asignado';
			} else {
				try {
					const clerkUser = await clerk.users.getUser(instructorId);
					instructorName =
						`${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim();
				} catch (_error) {
					console.log(
						'Instructor no encontrado en Clerk, buscando en base de datos...'
					);
					// Buscar en la base de datos
					const dbUser = await db
						.select({
							name: users.name,
						})
						.from(users)
						.where(eq(users.id, instructorId))
						.then((rows) => rows[0]);

					if (dbUser?.name) {
						instructorName = dbUser.name;
					} else {
						console.error('Instructor no encontrado en la base de datos');
						instructorName = 'Instructor no encontrado';
					}
				}
			}
		} catch (_error) {
			console.error('Error al obtener datos del instructor:', _error);
			instructorName = 'Instructor no encontrado';
		}

		return {
			...lessonData,
			course: {
				...lessonData.course,
				instructor: instructorName,
			},
		} as unknown as Lesson;
	} catch (_error) {
		console.error('Error al obtener la lección por ID:', _error);
		throw new Error('No se pudo cargar la lección');
	}
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
	try {
		// Log the start of the deletion process
		console.log(`Iniciando la eliminación de la lección con ID: ${lessonId}`);

		// Obtener las actividades asociadas a la lección
		const activityIds = await db
			.select({ id: activities.id })
			.from(activities)
			.where(eq(activities.lessonsId, lessonId))
			.then((rows) => rows.map((row) => row.id));

		// Eliminar el progreso de los usuarios asociado a las actividades
		if (activityIds.length > 0) {
			await db
				.delete(userActivitiesProgress)
				.where(inArray(userActivitiesProgress.activityId, activityIds));
		}

		// Eliminar las actividades asociadas a la lección
		await db.delete(activities).where(eq(activities.lessonsId, lessonId));

		// Eliminar el progreso de los usuarios asociado a la lección
		await db
			.delete(userLessonsProgress)
			.where(eq(userLessonsProgress.lessonId, lessonId));

		// Eliminar la lección
		await db.delete(lessons).where(eq(lessons.id, lessonId));
	} catch (_error) {
		// Log the error with more context
		console.error(`Error al eliminar la lección con ID: ${lessonId}`, _error);
		throw new Error('No se pudo eliminar la lección correctamente.');
	}
};

// Eliminar todas las lecciones asociadas a un curso por su ID
export const deleteLessonsByCourseId = async (courseId: number) => {
	try {
		// Obtener todas las lecciones asociadas al curso
		const lessonIds = await db
			.select({ id: lessons.id })
			.from(lessons)
			.where(eq(lessons.courseId, courseId))
			.then((rows) => rows.map((row) => row.id));

		// Obtener todas las actividades asociadas a las lecciones del curso
		const activityIds = await db
			.select({ id: activities.id })
			.from(activities)
			.where(inArray(activities.lessonsId, lessonIds))
			.then((rows) => rows.map((row) => row.id));

		// Eliminar el progreso de los usuarios asociado a las actividades
		if (activityIds.length > 0) {
			await db
				.delete(userActivitiesProgress)
				.where(inArray(userActivitiesProgress.activityId, activityIds));
		}

		// Eliminar todas las actividades asociadas a las lecciones del curso
		if (lessonIds.length > 0) {
			await db
				.delete(activities)
				.where(inArray(activities.lessonsId, lessonIds));
		}

		// Eliminar el progreso de los usuarios asociado a las lecciones del curso
		if (lessonIds.length > 0) {
			await db
				.delete(userLessonsProgress)
				.where(inArray(userLessonsProgress.lessonId, lessonIds));
		}

		// Eliminar todas las lecciones asociadas al curso
		await db.delete(lessons).where(eq(lessons.courseId, courseId));
	} catch (_error) {
		console.error(
			`Error al eliminar las lecciones del curso con ID: ${courseId}`,
			_error
		);
		throw new Error(
			'No se pudieron eliminar las lecciones del curso correctamente.'
		);
	}
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
