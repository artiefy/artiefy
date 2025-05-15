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
	console.log('📝 Starting enrollment process:', { userEmail, courseId });

	try {
		// Verificar inputs
		if (!userEmail || !courseId) {
			throw new Error('Email de usuario y ID del curso son requeridos');
		}

		// Buscar el usuario por email
		const user = await db.query.users.findFirst({
			where: eq(users.email, userEmail),
		});

		if (!user) {
			console.error('❌ User not found:', userEmail);
			throw new Error(`Usuario no encontrado: ${userEmail}`);
		}

		// Verificar si ya está inscrito y prevenir duplicados
		const existingEnrollment = await db.query.enrollments.findFirst({
			where: and(
				eq(enrollments.userId, user.id),
				eq(enrollments.courseId, courseId)
			),
		});

		if (existingEnrollment) {
			console.log('ℹ️ User already enrolled:', { userEmail, courseId });
			return { success: true, message: 'Usuario ya inscrito' };
		}

		// Crear la inscripción con transacción
		await db.transaction(async (tx) => {
			// 1. Crear inscripción
			await tx.insert(enrollments).values({
				userId: user.id,
				courseId: courseId,
				enrolledAt: new Date(),
				completed: false,
				isPermanent: true,
			});

			// 2. Obtener y ordenar lecciones
			const courseLessons = await tx.query.lessons.findMany({
				where: eq(lessons.courseId, courseId),
			});

			const sortedLessons = courseLessons.sort((a, b) => {
				return (
					extractNumberFromTitle(a.title) - extractNumberFromTitle(b.title)
				);
			});

			// 3. Crear progreso para cada lección
			for (const [index, lesson] of sortedLessons.entries()) {
				await tx.insert(userLessonsProgress).values({
					userId: user.id,
					lessonId: lesson.id,
					progress: 0,
					isCompleted: false,
					isLocked: index !== 0, // Primera lección desbloqueada
					isNew: true,
					lastUpdated: new Date(),
				});
			}
		});

		console.log('✅ Enrollment successful:', { userEmail, courseId });
		return { success: true, message: 'Inscripción exitosa' };
	} catch (error) {
		console.error('❌ Enrollment error:', error);
		throw error;
	}
}
