import { clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses, materias, users } from '~/server/db/schema';

export async function getCoursesByProgramId(programId: string) {
	try {
		const result = await db
			.selectDistinct({
				id: courses.id,
				title: courses.title,
				description: courses.description,
				coverImageKey: courses.coverImageKey,
				categoryid: courses.categoryid,
				instructor: courses.instructor,
				modalidadesid: courses.modalidadesid,
				nivelid: courses.nivelid,
				rating: courses.rating,
			})
			.from(courses)
			.innerJoin(materias, eq(materias.programaId, parseInt(programId)))
			.where(eq(courses.id, materias.courseid));

		// Obtener información de instructores
		const coursesWithInstructors = await Promise.all(
			result.map(async (course) => {
				if (!course.instructor) {
					return { ...course, instructorName: 'Sin instructor asignado' };
				}

				try {
					// Primero intentar obtener de la tabla users
					const dbUser = await db
						.select()
						.from(users)
						.where(eq(users.id, course.instructor))
						.limit(1);

					if (dbUser?.[0]?.name) {
						return { ...course, instructorName: dbUser[0].name };
					}

					// Si no está en DB, intentar con Clerk
					try {
						const clerk = await clerkClient();
						const user = await clerk.users.getUser(course.instructor);
						const name =
							`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
						return {
							...course,
							instructorName: name || course.instructor,
						};
					} catch (_) {
						// Si falla Clerk, usar el campo instructor directamente
						return {
							...course,
							instructorName: course.instructor,
						};
					}
				} catch (error) {
					console.error(
						`Error fetching instructor for course ${course.id}:`,
						error
					);
					return { ...course, instructorName: course.instructor };
				}
			})
		);

		return coursesWithInstructors;
	} catch (error) {
		console.error('Error fetching courses:', error);
		return [];
	}
}
