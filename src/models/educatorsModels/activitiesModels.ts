import { eq } from 'drizzle-orm';

import { db } from '~/server/db/index';
import {
	activities,
	lessons,
	courses,
	typeActi,
	userActivitiesProgress,
} from '~/server/db/schema';

// Interfaces
export interface Activity {
	id: number;
	name: string;
	description: string | null;
	typeid: number;
	lessonsId: number;
	pesoNota: number;
	revisada: boolean;
}

// Actualizar la interfaz ActivityDetails
export interface ActivityDetails {
	id: number;
	name: string;
	description: string | null;
	type: {
		id: number;
		name: string;
		description: string;
	};
	revisada: boolean;
	pesoNota: number | null;
	lessonsId: {
		id: number;
		title: string;
		coverImageKey: string;
		courseId: {
			id: number | null;
			title: string | null;
			description: string | null;
			instructor: string | null;
		};
	};
}

// CRUD Operations
// Crear una nueva actividad
export const createActivity = async ({
	name,
	description,
	typeid,
	lessonsId,
	pesoNota,
	revisada,
}: Omit<Activity, 'id'>): Promise<Activity> => {
	// Cambiar el tipo de retorno a Promise<Activity>
	try {
		const [newActivity] = await db
			.insert(activities)
			.values({
				name,
				description,
				typeid,
				lessonsId,
				pesoNota,
				revisada,
			})
			.returning({
				id: activities.id,
				name: activities.name,
				description: activities.description,
				typeid: activities.typeid,
				lessonsId: activities.lessonsId,
				pesoNota: activities.pesoNota,
				revisada: activities.revisada,
			}); // Retornar todos los campos, incluyendo el ID

		if (!newActivity) {
			throw new Error('Error al crear la actividad: actividad no creada');
		}
		return {
			...newActivity,
			revisada: newActivity.revisada ?? false,
			pesoNota: newActivity.pesoNota ?? 0,
		}; // Retornar la nueva actividad creada
	} catch (error) {
		throw new Error(
			`Error al crear la actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`
		);
	}
};

// Obtener una actividad por ID
export const getActivityById = async (activityId: number) => {
	try {
		const result = await db
			.select({
				id: activities.id,
				name: activities.name,
				description: activities.description,
				type: {
					id: typeActi.id,
					name: typeActi.name,
					description: typeActi.description,
				},
				revisada: activities.revisada,
				pesoNota: activities.pesoNota,
				lesson: {
					id: lessons.id,
					title: lessons.title,
					coverImageKey: lessons.coverImageKey,
					courseId: courses.id,
					courseTitle: courses.title,
					courseDescription: courses.description,
					courseInstructor: courses.instructor,
				},
			})
			.from(activities)
			.leftJoin(typeActi, eq(activities.typeid, typeActi.id))
			.leftJoin(lessons, eq(activities.lessonsId, lessons.id))
			.leftJoin(courses, eq(lessons.courseId, courses.id))
			.where(eq(activities.id, activityId))
			.limit(1);

		const activity = result[0] as unknown as ActivityDetails;

		if (!activity) {
			return null;
		}

		return activity;
	} catch (error) {
		throw new Error(
			`Error al obtener la actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`
		);
	}
};

// Obtener todas las actividades de una lección
export const getActivitiesByLessonId = async (
	lessonId: number
): Promise<ActivityDetails[]> => {
	try {
		const actividades = await db
			.select({
				id: activities.id,
				name: activities.name,
				description: activities.description,
				type: {
					id: typeActi.id,
					name: typeActi.name,
					description: typeActi.description,
				},
				pesoNota: activities.pesoNota,
				revisada: activities.revisada,
				lesson: {
					id: lessons.id,
					title: lessons.title,
					coverImageKey: lessons.coverImageKey,
					courseId: courses.id,
					courseTitle: courses.title,
					courseDescription: courses.description,
					courseInstructor: courses.instructor,
				},
			})
			.from(activities)
			.leftJoin(typeActi, eq(activities.typeid, typeActi.id))
			.leftJoin(lessons, eq(activities.lessonsId, lessons.id))
			.leftJoin(courses, eq(lessons.courseId, courses.id))
			.where(eq(activities.lessonsId, lessonId));

		return actividades.map((actividad) => ({
			id: actividad.id,
			name: actividad.name,
			description: actividad.description,
			type: {
				id: actividad.type?.id ?? 0,
				name: actividad.type?.name ?? '',
				description: actividad.type?.description ?? '',
			},
			revisada: actividad.revisada ?? false,
			pesoNota: actividad.pesoNota ?? 0,
			lessonsId: {
				id: actividad.lesson.id ?? 0,
				title: actividad.lesson.title ?? '',
				coverImageKey: actividad.lesson.coverImageKey ?? '',
				courseId: {
					id: actividad.lesson.courseId,
					title: actividad.lesson.courseTitle,
					description: actividad.lesson.courseDescription,
					instructor: actividad.lesson.courseInstructor,
				},
			},
		}));
	} catch (error) {
		console.error('Error fetching activities by lesson ID:', error);
		throw error;
	}
};

// Actualizar una actividad
export const updateActivity = async (
	activityId: number,
	{ name, description, typeid }: Partial<Omit<Activity, 'id' | 'lessonsId'>>
): Promise<void> => {
	try {
		const updateData: Partial<Omit<Activity, 'id' | 'lessonsId'>> = {};
		if (name !== undefined) updateData.name = name;
		if (description !== undefined) updateData.description = description;
		if (typeid !== undefined) updateData.typeid = typeid;

		await db
			.update(activities)
			.set(updateData)
			.where(eq(activities.id, activityId));
	} catch (error) {
		throw new Error(
			`Error al actualizar la actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`
		);
	}
};

// Eliminar una actividad y todos los datos asociados
export const deleteActivity = async (activityId: number): Promise<void> => {
	try {
		// Eliminar los datos asociados en userActivitiesProgress
		await db
			.delete(userActivitiesProgress)
			.where(eq(userActivitiesProgress.activityId, activityId));

		// Eliminar la actividad
		await db.delete(activities).where(eq(activities.id, activityId));
	} catch (error) {
		throw new Error(
			`Error al eliminar la actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`
		);
	}
};

//Delete all activities by lesson id
export const deleteActivitiesByLessonId = async (lessonId: number) => {
	// Elimina las actividades asociadas a la lección
	await db.delete(activities).where(eq(activities.lessonsId, lessonId));
};
