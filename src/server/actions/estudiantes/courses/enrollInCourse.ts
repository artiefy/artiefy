'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { getUserLessonsProgress } from '~/server/actions/estudiantes/progress/getUserLessonsProgress';
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

		// Verificar si el usuario ya está inscrito
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

		// Verificar si el usuario existe en la base de datos
		const existingUser = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});

		// Si el usuario no existe en la base de datos, crearlo
		if (!existingUser) {
			const primaryEmail = user.emailAddresses.find(
				(email) => email.id === user.primaryEmailAddressId
			);

			if (!user.fullName || !primaryEmail?.emailAddress) {
				return {
					success: false,
					message: 'Información del usuario incompleta en Clerk',
				};
			}

			try {
				await db.insert(users).values({
					id: userId,
					role: 'student',
					name: user.fullName,
					email: primaryEmail.emailAddress,
					subscriptionStatus: 'active', // Por defecto active ya que solo usuarios con plan pueden inscribirse
					subscriptionEndDate: new Date(Date.now()),
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			} catch (error) {
				console.error('Error creating user:', error);
				return {
					success: false,
					message: 'Error al crear el usuario en la base de datos',
				};
			}
		}

		// Crear la inscripción
		const [newEnrollment] = await db
			.insert(enrollments)
			.values({
				userId,
				courseId,
				enrolledAt: new Date(),
				completed: false,
			})
			.returning();

		if (!newEnrollment) {
			return {
				success: false,
				message: 'Error al crear la inscripción',
			};
		}

		// Configurar la primera lección
		const lessonsList = await db.query.lessons.findMany({
			where: eq(lessons.courseId, courseId),
		});

		if (lessonsList.length > 0) {
			const sortedLessons = lessonsList.sort((a, b) =>
				a.title.localeCompare(b.title)
			);
			const firstLesson = sortedLessons[0];

			const { lessonsProgress } = await getUserLessonsProgress(userId);
			const existingProgress = lessonsProgress.find(
				(progress) => progress.lessonId === firstLesson.id
			);

			if (!existingProgress) {
				await db.insert(userLessonsProgress).values({
					userId,
					lessonId: firstLesson.id,
					progress: 0,
					isCompleted: false,
					isLocked: false,
					lastUpdated: new Date(),
				});
			}
		}

		return {
			success: true,
			message: 'Inscripción exitosa',
		};
	} catch (error: unknown) {
		console.error('Error al inscribirse en el curso:', error);
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Error desconocido',
		};
	}
}

export async function isUserEnrolled(
	courseId: number,
	userId: string
): Promise<boolean> {
	const existingEnrollment = await db.query.enrollments.findFirst({
		where: and(
			eq(enrollments.userId, userId),
			eq(enrollments.courseId, courseId)
		),
	});
	return !!existingEnrollment;
}
