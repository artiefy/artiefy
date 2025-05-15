'use server';

import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	users,
	enrollments,
	lessons,
	userLessonsProgress,
} from '~/server/db/schema';

export async function enrollUserInCourse(userEmail: string, courseId: number) {
	console.log('📝 Starting enrollment process:', { userEmail, courseId });

	try {
		// Verificar usuario
		const user = await db.query.users.findFirst({
			where: eq(users.email, userEmail),
		});

		if (!user) {
			throw new Error(`Usuario no encontrado: ${userEmail}`);
		}

		// Verificar inscripción existente
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

		// 1. Crear inscripción
		await db.insert(enrollments).values({
			userId: user.id,
			courseId: courseId,
			enrolledAt: new Date(),
			completed: false,
			isPermanent: true,
		});

		// 2. Obtener lecciones
		const courseLessons = await db.query.lessons.findMany({
			where: eq(lessons.courseId, courseId),
		});

		const sortedLessons = courseLessons.sort((a, b) => {
			const match1 = /\d+/.exec(a.title);
			const match2 = /\d+/.exec(b.title);
			return (
				(match1 ? parseInt(match1[0], 10) : 0) -
				(match2 ? parseInt(match2[0], 10) : 0)
			);
		});

		// 3. Crear progreso para cada lección, verificando duplicados
		for (const [index, lesson] of sortedLessons.entries()) {
			// Verificar si ya existe un progreso para esta lección
			const existingProgress = await db.query.userLessonsProgress.findFirst({
				where: and(
					eq(userLessonsProgress.userId, user.id),
					eq(userLessonsProgress.lessonId, lesson.id)
				),
			});

			if (!existingProgress) {
				await db.insert(userLessonsProgress).values({
					userId: user.id,
					lessonId: lesson.id,
					progress: 0,
					isCompleted: false,
					isLocked: index !== 0,
					isNew: true,
					lastUpdated: new Date(),
				});
			}
		}

		console.log('✅ Enrollment successful:', { userEmail, courseId });
		return { success: true, message: 'Inscripción exitosa' };
	} catch (error) {
		console.error('❌ Enrollment error:', error);
		throw error;
	}
}
