import { invalidateCoursesCache } from '~/server/actions/courses/getAllCourses';
import { db } from '~/server/db';
import { courses } from '~/server/db/schema';
import { type Course } from '~/types';

export const createCourse = async (newCourseData: Course): Promise<void> => {
	try {
		// Transformar las fechas a objetos Date si es necesario
		const transformedData = {
			...newCourseData,
			createdAt: new Date(newCourseData.createdAt),
			updatedAt: new Date(newCourseData.updatedAt),
		};

		await db.insert(courses).values(transformedData);
		invalidateCoursesCache();
	} catch (error) {
		console.error('Error al crear el curso:', error);
		throw new Error(
			'Error al crear el curso: ' +
				(error instanceof Error ? error.message : String(error))
		);
	}
};
