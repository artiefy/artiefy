import { clerkClient } from '@clerk/nextjs/server';
import { eq, count, sum } from 'drizzle-orm';

import { db } from '~/server/db/index';
import { courses, lessons, enrollments } from '~/server/db/schema';

// Obtener todos los datos de un usuario
export const getUserData = async (userId: string) => {
	// Get user's full name from Clerk
	const clerk = await clerkClient();
	const user = await clerk.users.getUser(userId);
	const instructorFullName = `${user.firstName} ${user.lastName}`.trim();

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
		.where(eq(courses.instructor, instructorFullName))
		.then((rows) => rows[0]?.totalLessons ?? 0);

	// Obtener el número total de estudiantes inscritos en los cursos del usuario
	const totalEnrollments = await db
		.select({ totalEnrollments: count() })
		.from(enrollments)
		.innerJoin(courses, eq(courses.id, enrollments.courseId))
		.where(eq(courses.instructor, instructorFullName))
		.then((rows) => rows[0]?.totalEnrollments ?? 0);

	// Obtener la duración total de todas las clases de los cursos del usuario
	const totalDuration = await db
		.select({ totalDuration: sum(lessons.duration) })
		.from(lessons)
		.innerJoin(courses, eq(courses.id, lessons.courseId))
		.where(eq(courses.instructor, instructorFullName))
		.then((rows) => rows[0]?.totalDuration ?? 0);

	// Obtener el promedio de estudiantes inscritos por curso
	const averageEnrollments =
		totalCourses > 0 ? totalEnrollments / totalCourses : 0;

	return {
		instructor: instructorFullName,
		totalCourses,
		totalLessons,
		totalEnrollments,
		totalDuration,
		averageEnrollments,
	};
};
