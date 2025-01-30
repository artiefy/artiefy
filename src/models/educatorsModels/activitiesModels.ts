import { eq } from 'drizzle-orm';

import { db } from '~/server/db/index';
import { activities, lessons, courses, typeActi } from '~/server/db/schema';

// Interfaces
export interface Activity {
	id: number;
	name: string;
	description: string | null;
	typeid: number;
	lessonsId: number;
}

// Interface with details
export interface ActivityDetails {
	id: number;
	name: string;
	description: string | null;
	type: {
		id: number;
		name: string;
		description: string;
	};
	lessonsId: {
		id: number;
		title: string;
		coverImageKey: string;
		courseId: {
			id: number;
			title: string;
			description: string;
			instructor: string;
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
			})
			.returning({
				id: activities.id,
				name: activities.name,
				description: activities.description,
				typeid: activities.typeid,
				lessonsId: activities.lessonsId,
			}); // Retornar todos los campos, incluyendo el ID

		if (!newActivity) {
			throw new Error('Error al crear la actividad: actividad no creada');
		}
		return newActivity; // Retornar la nueva actividad creada
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
): Promise<Activity[]> => {
	try {
		//const actividades =
		return await db
			.select
			//   {
			//   id: activities.id,
			//   name: activities.name,
			//   description: activities.description,
			//   typeid:{
			//     id: typeActi.id,
			//     name: typeActi.name,
			//     description: typeActi.description
			//   },
			//   lessonsId:{
			//     id: lessons.id,
			//     title: lessons.title
			//   },
			// }
			()
			.from(activities)
			.where(eq(activities.lessonsId, lessonId));
		//return actividades;
	} catch (error) {
		throw new Error(
			`Error al obtener las actividades de la lección: ${error instanceof Error ? error.message : 'Error desconocido'}`
		);
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

// Eliminar una actividad
export const deleteActivity = async (activityId: number): Promise<void> => {
	try {
		await db.delete(activities).where(eq(activities.id, activityId));
	} catch (error) {
		throw new Error(
			`Error al eliminar la actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`
		);
	}
};
