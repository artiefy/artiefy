'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

<<<<<<< HEAD
=======
import { getUserLessonsProgress } from '~/server/actions/estudiantes/progress/getUserLessonsProgress';
>>>>>>> dev/miguel
import { db } from '~/server/db';
import {
	users,
	enrollments,
	lessons,
	userLessonsProgress,
	courses,
} from '~/server/db/schema';

import type { EnrollmentResponse, SubscriptionLevel } from '~/types';

export async function enrollInCourse(
	courseId: number
): Promise<EnrollmentResponse> {
	try {
		const user = await currentUser();

		if (!user?.id) {
			return {
				success: false,
				message: 'Usuario no autenticado',
			};
		}

		const userId = user.id;

		// Get course with type
		const course = await db.query.courses.findFirst({
			where: eq(courses.id, courseId),
			with: {
				courseType: true,
			},
		});

		if (!course) {
			return { success: false, message: 'Curso no encontrado' };
		}

		 // Add type assertion for requiredSubscriptionLevel
		const subscriptionLevel = course.courseType?.requiredSubscriptionLevel as SubscriptionLevel;

		// Allow enrollment for free courses without subscription check
		if (subscriptionLevel === 'none') {
			// Process enrollment but maintain progressive unlocking
			await db.insert(enrollments).values({
				userId: user.id,
				courseId: courseId,
				enrolledAt: new Date(),
				completed: false,
			});

			// Configure lesson progress with progressive unlocking
			const courseLessons = await db.query.lessons.findMany({
				where: eq(lessons.courseId, courseId),
				orderBy: (lessons, { asc }) => [asc(lessons.title)],
			});

			for (const courseLesson of courseLessons) {
				const isFirstLesson = courseLesson.id === courseLessons[0].id;

				await db.insert(userLessonsProgress).values({
					userId: userId,
					lessonId: courseLesson.id,
					progress: 0,
					isCompleted: false,
					isLocked: !isFirstLesson, // Only first lesson unlocked
					isNew: isFirstLesson,
					lastUpdated: new Date(),
				});
			}

			return { success: true, message: 'Inscripción exitosa' };
		}

		// For subscription-based courses, check subscription level
		const requiredLevel = course.courseType?.requiredSubscriptionLevel;
		if (requiredLevel && requiredLevel !== 'none' as SubscriptionLevel) {
			const dbUser = await db.query.users.findFirst({
				where: eq(users.id, userId),
			});

			if (
				!dbUser?.subscriptionStatus ||
				dbUser.subscriptionStatus !== 'active'
			) {
				return {
					success: false,
					message: 'Se requiere una suscripción activa',
					requiresSubscription: true,
				};
			}
		}

		// 1. Primero, asegurarse de que el usuario existe en nuestra base de datos
		let dbUser = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (!dbUser) {
			// Si el usuario no existe, crearlo primero
			const primaryEmail = user.emailAddresses.find(
				(email) => email.id === user.primaryEmailAddressId
			);

			if (!primaryEmail?.emailAddress) {
				return {
					success: false,
					message: 'No se pudo obtener el email del usuario',
				};
			}

			await db.insert(users).values({
				id: userId,
				name:
					user.firstName && user.lastName
						? `${user.firstName} ${user.lastName}`
						: 'Usuario',
				email: primaryEmail.emailAddress,
				role: 'student',
				subscriptionStatus: 'active',
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Reintentar obtener el usuario después de crearlo
			dbUser = await db.query.users.findFirst({
				where: eq(users.id, userId),
			});

			if (!dbUser) {
				return {
					success: false,
					message: 'No se pudo crear el usuario en la base de datos',
				};
			}
		}

		// 2. Verificar si ya está inscrito
		const existingEnrollment = await db.query.enrollments.findFirst({
			where: and(
				eq(enrollments.userId, userId),
				eq(enrollments.courseId, courseId)
			),
		});

		if (existingEnrollment) {
			return {
				success: false,
				message: 'Ya estás inscrito en este curso',
			};
		}

		// 3. Crear la inscripción
		const newEnrollment = await db.insert(enrollments).values({
			userId: userId,
			courseId: courseId,
			enrolledAt: new Date(),
			completed: false,
		});

		if (!newEnrollment) {
			throw new Error('No se pudo crear la inscripción');
		}

		// 4. Configurar la primera lección como desbloqueada
		const courseLessons = await db.query.lessons.findMany({
			where: eq(lessons.courseId, courseId),
			orderBy: (lessons, { asc }) => [asc(lessons.title)],
		});

		 // Initialize lessons progress - mismo comportamiento para todos los tipos de curso
		for (const courseLesson of courseLessons) {
			const isFirstLesson = courseLesson.id === courseLessons[0].id;

			await db.insert(userLessonsProgress).values({
				userId: userId,
				lessonId: courseLesson.id,
				progress: 0,
				isCompleted: false,
				isLocked: !isFirstLesson, // Solo la primera lección desbloqueada, independiente del tipo de curso
				isNew: isFirstLesson,
				lastUpdated: new Date(),
			});
		}

		return {
			success: true,
			message: 'Inscripción exitosa',
		};
	} catch (error) {
		console.error('Error en enrollInCourse:', error);

		// Si el error es de duplicado de enrollment
		if (error instanceof Error && error.message.includes('duplicate key')) {
			return {
				success: false,
				message: 'Ya estás inscrito en este curso',
			};
		}

		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: 'Error desconocido al inscribirse',
		};
	}
}

export async function isUserEnrolled(
	courseId: number,
	userId: string
): Promise<boolean> {
	try {
		const existingEnrollment = await db.query.enrollments.findFirst({
			where: and(
				eq(enrollments.userId, userId),
				eq(enrollments.courseId, courseId)
			),
		});
		return !!existingEnrollment;
	} catch (error) {
		console.error('Error checking enrollment:', error);
		throw new Error('Failed to check enrollment status');
	}
}
