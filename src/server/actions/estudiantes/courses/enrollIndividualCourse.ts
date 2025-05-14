'use server';

import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	users,
	enrollments,
	lessons,
	userLessonsProgress,
} from '~/server/db/schema';

function extractNumberFromTitle(title: string): number {
	const match = /\d+/.exec(title);
	return match ? parseInt(match[0], 10) : 0;
}

export async function enrollUserInCourse(userEmail: string, courseId: number) {
	try {
		// Buscar el usuario por email
		const user = await db.query.users.findFirst({
			where: eq(users.email, userEmail),
		});

		if (!user) {
			throw new Error(`Usuario no encontrado con email: ${userEmail}`);
		}

		// Verificar si ya está inscrito
		const existingEnrollment = await db.query.enrollments.findFirst({
			where: and(
				eq(enrollments.userId, user.id),
				eq(enrollments.courseId, courseId)
			),
		});

		if (existingEnrollment) {
			return { success: false, message: 'Ya estás inscrito en este curso' };
		}

		// Crear la inscripción permanente
		await db.insert(enrollments).values({
			userId: user.id,
			courseId: courseId,
			enrolledAt: new Date(),
			completed: false,
			isPermanent: true,
		});

		// Obtener y ordenar todas las lecciones del curso
		const courseLessons = await db.query.lessons.findMany({
			where: eq(lessons.courseId, courseId),
		});

		// Ordenar lecciones por número en el título
		const sortedLessons = courseLessons.sort((a, b) => {
			return extractNumberFromTitle(a.title) - extractNumberFromTitle(b.title);
		});

		// Crear progreso para cada lección, con la primera desbloqueada
		for (const [index, lesson] of sortedLessons.entries()) {
			await db.insert(userLessonsProgress).values({
				userId: user.id,
				lessonId: lesson.id,
				progress: 0,
				isCompleted: false,
				isLocked: index !== 0, // Primera lección desbloqueada
				isNew: true,
				lastUpdated: new Date(),
			});
		}

		console.log('✅ Usuario inscrito permanentemente en el curso:', {
			userEmail,
			courseId,
		});

		return { success: true, message: 'Inscripción exitosa' };
	} catch (error) {
		console.error('❌ Error al inscribir usuario en curso:', error);
		throw new Error(
			error instanceof Error ? error.message : 'Error desconocido'
		);
	}
}
