'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, and, inArray } from 'drizzle-orm'; // Add inArray import

import { db } from '~/server/db';
import {
	users,
	enrollments,
	lessons,
	userLessonsProgress,
	courses,
} from '~/server/db/schema';
import { sortLessons } from '~/utils/lessonSorting';

import type { EnrollmentResponse, SubscriptionLevel } from '~/types';

export async function enrollInCourse(
	courseId: number
): Promise<EnrollmentResponse> {
	let course = null; // Declare course variable in function scope

	try {
		const user = await currentUser();

		if (!user?.id) {
			return {
				success: false,
				message: 'Usuario no autenticado',
			};
		}

		const userId = user.id;

		// Get course information first to determine subscription status
		course = await db.query.courses.findFirst({
			where: eq(courses.id, courseId),
			with: {
				courseType: true,
			},
		});

		if (!course) {
			return { success: false, message: 'Curso no encontrado' };
		}

		// Determine subscription status based on course type
		const subscriptionLevel = course.courseType
			?.requiredSubscriptionLevel as SubscriptionLevel;
		const shouldBeActive = subscriptionLevel !== 'none';

		// Check if user exists
		let dbUser = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (!dbUser) {
			const primaryEmail = user.emailAddresses.find(
				(email) => email.id === user.primaryEmailAddressId
			);

			if (!primaryEmail?.emailAddress) {
				return {
					success: false,
					message: 'No se pudo obtener el email del usuario',
				};
			}

			try {
				await db.insert(users).values({
					id: userId,
					name:
						user.firstName && user.lastName
							? `${user.firstName} ${user.lastName}`
							: (user.firstName ?? 'Usuario'),
					email: primaryEmail.emailAddress,
					role: 'estudiante',
					subscriptionStatus: shouldBeActive ? 'active' : 'inactive', // Set based on course type
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				// Verificar que el usuario se creó correctamente
				dbUser = await db.query.users.findFirst({
					where: eq(users.id, userId),
				});

				if (!dbUser) {
					throw new Error('Error al crear el usuario en la base de datos');
				}
			} catch (error) {
				console.error('Error creating user:', error);
				return {
					success: false,
					message: 'Error al crear el usuario en la base de datos',
				};
			}
		}

		// 3. Verificar si ya está inscrito
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

		// Verify subscription level requirements
		const userPlanType = user.publicMetadata?.planType as string;
		const courseRequiredLevel = course.courseType?.requiredSubscriptionLevel;

		if (courseRequiredLevel === 'premium' && userPlanType === 'Pro') {
			return {
				success: false,
				message:
					'Este curso requiere una suscripción Premium. Actualiza tu plan para acceder.',
				requiresSubscription: true,
			};
		}

		const subscriptionStatus = user.publicMetadata?.subscriptionStatus;
		const subscriptionEndDate = user.publicMetadata?.subscriptionEndDate as
			| string
			| null;

		const isSubscriptionValid =
			subscriptionStatus === 'active' &&
			(!subscriptionEndDate || new Date(subscriptionEndDate) > new Date());

		if (courseRequiredLevel !== 'none' && !isSubscriptionValid) {
			return {
				success: false,
				message: 'Se requiere una suscripción activa',
				requiresSubscription: true,
			};
		}

		// Crear inscripción y configurar lecciones
		await db.insert(enrollments).values({
			userId: userId,
			courseId: courseId,
			enrolledAt: new Date(),
			completed: false,
		});

		// Configure lesson progress with progressive unlocking
		const courseLessons = await db.query.lessons.findMany({
			where: eq(lessons.courseId, courseId),
		});

		// Sort lessons using our shared sorting utility
		const sortedLessons = sortLessons(courseLessons);

		// Get lesson IDs in correct order
		const lessonIds = sortedLessons.map((lesson) => lesson.id);

		// Get existing progress records for this user and these specific lessons
		const existingProgress = await db.query.userLessonsProgress.findMany({
			where: and(
				eq(userLessonsProgress.userId, userId),
				inArray(userLessonsProgress.lessonId, lessonIds)
			),
		});

		// Create a Set of existing lesson progress for faster lookup
		const existingProgressSet = new Set(
			existingProgress.map((progress) => progress.lessonId)
		);

		// Insert progress only for lessons that don't have progress
		for (const [index, lesson] of sortedLessons.entries()) {
			if (!existingProgressSet.has(lesson.id)) {
				await db.insert(userLessonsProgress).values({
					userId: userId,
					lessonId: lesson.id,
					progress: 0,
					isCompleted: false,
					// Solo desbloquear la primera lección (Bienvenida o primera en secuencia)
					isLocked: index !== 0,
					isNew: true,
					lastUpdated: new Date(),
				});
			}
		}

		return {
			success: true,
			message: 'Inscripción exitosa',
		};
	} catch (error) {
		console.error(
			'Error en enrollInCourse:',
			error instanceof Error ? error.message : 'Unknown error'
		);
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: 'Error desconocido al inscribirse',
			requiresSubscription:
				course?.courseType?.requiredSubscriptionLevel !== 'none',
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
