'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	users,
	enrollments,
	lessons,
	userLessonsProgress,
} from '~/server/db/schema';

export async function enrollInCourse(
	courseId: number
): Promise<{ success: boolean; message: string }> {
	try {
		const user = await currentUser();

		if (!user?.id) {
			return {
				success: false,
				message: 'Usuario no autenticado',
			};
		}

		const userId = user.id;

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

		for (const courseLesson of courseLessons) {
			// Verificar si ya existe un progreso para esta lección
			const existingProgress = await db.query.userLessonsProgress.findFirst({
				where: and(
					eq(userLessonsProgress.userId, userId),
					eq(userLessonsProgress.lessonId, courseLesson.id)
				),
			});

			// Solo crear el progreso si no existe
			if (!existingProgress) {
				await db.insert(userLessonsProgress).values({
					userId: userId,
					lessonId: courseLesson.id,
					progress: 0,
					isCompleted: false,
					isLocked: courseLesson.id !== courseLessons[0].id, // Desbloquear solo la primera lección
					isNew: courseLesson.id === courseLessons[0].id, // Marcar como nueva solo la primera lección
					lastUpdated: new Date(),
				});
			} else {
				// Si ya existe, actualizar isNew a true solo para las lecciones desbloqueadas y con progreso menor al 1%
				await db
					.update(userLessonsProgress)
					.set({ isNew: existingProgress.progress < 1 })
					.where(
						and(
							eq(userLessonsProgress.userId, userId),
							eq(userLessonsProgress.lessonId, courseLesson.id),
							eq(userLessonsProgress.isLocked, false)
						)
					);
			}
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
