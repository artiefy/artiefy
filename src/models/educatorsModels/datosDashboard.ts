import { eq, count, sum } from 'drizzle-orm';

import { db } from '~/server/db/index';
import { courses, lessons, users, enrollments } from '~/server/db/schema';

// Obtener todos los datos de un usuario
export const getUserData = async (userId: string) => {
	// Obtener el número total de cursos creados por el usuario
	const totalCourses = await db
		.select({ totalCourses: count() })
		.from(courses)
		.where(eq(courses.creatorId, userId))
		.then((rows) => rows[0]?.totalCourses ?? 0);

	// Obtener el número total de clases (lessons) creadas por el usuario
	const totalLessons = await db
		.select({ totalLessons: count() })
		.from(lessons)
		.innerJoin(courses, eq(courses.id, lessons.courseId))
		.where(eq(courses.creatorId, userId))
		.then((rows) => rows[0]?.totalLessons ?? 0);

	// Obtener el número total de estudiantes inscritos en los cursos del usuario
	const totalEnrollments = await db
		.select({ totalEnrollments: count() })
		.from(enrollments)
		.innerJoin(courses, eq(courses.id, enrollments.courseId))
		.where(eq(courses.creatorId, userId))
		.then((rows) => rows[0]?.totalEnrollments ?? 0);

	// Obtener la duración total de todas las clases de los cursos del usuario
	const totalDuration = await db
		.select({ totalDuration: sum(lessons.duration) })
		.from(lessons)
		.innerJoin(courses, eq(courses.id, lessons.courseId))
		.where(eq(courses.creatorId, userId))
		.then((rows) => rows[0]?.totalDuration ?? 0);

	// Obtener el promedio de estudiantes inscritos por curso
	const averageEnrollments =
		totalCourses > 0 ? totalEnrollments / totalCourses : 0;

	// Obtener los datos del usuario
	const userData = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			createdAt: users.createdAt,
		})
		.from(users)
		.where(eq(users.id, userId))
		.then((rows) => rows[0]);

	if (!userData) {
		throw new Error('Usuario no encontrado');
	}

	return {
		...userData,
		totalCourses,
		totalLessons,
		totalEnrollments,
		totalDuration,
		averageEnrollments, // Agregar el promedio de estudiantes inscritos
	};
};
