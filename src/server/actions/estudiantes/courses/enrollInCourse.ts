'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { db } from '~/server/db';
import { users, enrollments, lessons, userLessonsProgress } from '~/server/db/schema';

export async function enrollInCourse(
	courseId: number
): Promise<{ success: boolean; message: string }> {
	const user = await currentUser();

	if (!user?.id) {
		throw new Error('Usuario no autenticado');
	}

	const userId = user.id;

	try {
		// Buscar si el usuario ya existe en la base de datos
		let existingUser = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});

		// Si el usuario no existe, crearlo con estado `inactive`
		if (!existingUser) {
			if (!user.fullName || !user.emailAddresses[0]?.emailAddress) {
				throw new Error('Información del usuario incompleta');
			}

			await db.insert(users).values({
				id: userId,
				role: 'student',
				name: user.fullName,
				email: user.emailAddresses[0].emailAddress,
				subscriptionStatus: 'inactive', // Se crea con `inactive`
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Recuperar el usuario recién creado para evitar `undefined`
			existingUser = await db.query.users.findFirst({
				where: eq(users.id, userId),
			});

			if (!existingUser) {
				throw new Error('Error al crear el usuario en la base de datos');
			}
		}

		// Verificar el estado de la suscripción
		if (existingUser.subscriptionStatus !== 'active') {
			return {
				success: false,
				message: 'Debes tener una suscripción activa para inscribirte en este curso',
			};
		}

		// Verificar si el usuario ya está inscrito
		const existingEnrollment = await db.query.enrollments.findFirst({
			where: and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
		});

		if (existingEnrollment) {
			return { success: false, message: 'Ya estás inscrito en este curso' };
		}

		// Inscribir al usuario en el curso
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
			return { success: false, message: 'Error al crear la inscripción' };
		}

		// Obtener la primera lección y desbloquearla
		const lessonsList = await db.query.lessons.findMany({
			where: eq(lessons.courseId, courseId),
		});

		const sortedLessons = lessonsList.sort(
			(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
		);

		const firstLesson = sortedLessons[0];

		if (firstLesson) {
			await db.insert(userLessonsProgress).values({
				userId,
				lessonId: firstLesson.id,
				progress: 0,
				isCompleted: false,
				isLocked: false,
				lastUpdated: new Date(),
			});
		}

		return { success: true, message: 'Inscripción exitosa' };
	} catch (error: unknown) {
		console.error('Error al inscribirse en el curso:', error);
		return {
			success: false,
			message: `Error al inscribirse en el curso: ${
				error instanceof Error ? error.message : 'Desconocido'
			}`,
		};
	}
}

// Exportar isUserEnrolled para que otros módulos puedan importarlo
export async function isUserEnrolled(
	courseId: number,
	userId: string
): Promise<boolean> {
	const existingEnrollment = await db.query.enrollments.findFirst({
		where: and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
	});
	return !!existingEnrollment;
}
