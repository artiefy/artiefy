'use server';

import { currentUser } from '@clerk/nextjs/server';
<<<<<<< HEAD
import { eq, and, or, gt } from 'drizzle-orm';
=======
import { eq, and } from 'drizzle-orm';
>>>>>>> dev/miguel

import { db } from '~/server/db';
import { enrollments, userLessonsProgress } from '~/server/db/schema';

export async function unenrollFromCourse(
	courseId: number
): Promise<{ success: boolean; message: string }> {
	const user = await currentUser();

	if (!user?.id) {
		return {
			success: false,
			message: 'Usuario no autenticado',
		};
	}

	const userId = user.id;

	try {
		const existingEnrollment = await db.query.enrollments.findFirst({
			where: and(
				eq(enrollments.userId, userId),
				eq(enrollments.courseId, courseId)
			),
		});

		if (!existingEnrollment) {
			return {
				success: false,
				message: 'No estás inscrito en este curso',
			};
		}

		await db
			.delete(enrollments)
			.where(
				and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
			);

		// Actualizar el progreso de las lecciones del curso
		await db
			.update(userLessonsProgress)
			.set({ isNew: false })
			.where(
				and(
					eq(userLessonsProgress.userId, userId),
					eq(userLessonsProgress.lessonId, existingEnrollment.courseId),
					or(
						eq(userLessonsProgress.progress, 0),
						gt(userLessonsProgress.progress, 1)
					)
				)
			);

		return {
			success: true,
			message: 'Desinscripción exitosa',
		};
	} catch (error) {
		console.error('Error al desuscribirse del curso:', error);
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: 'Error desconocido al desuscribirse del curso',
		};
	}
}
