'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollments } from '~/server/db/schema';

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
