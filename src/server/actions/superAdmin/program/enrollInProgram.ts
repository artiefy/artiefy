'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollmentPrograms } from '~/server/db/schema';

export async function enrollInProgram(
	programId: number
): Promise<{ success: boolean; message: string }> {
	try {
		const user = await currentUser();

		if (!user?.id) {
			return {
				success: false,
				message: 'Usuario no autenticado',
			};
		}

		// Verificar el estado de la suscripción directamente desde los metadatos de Clerk
		const subscriptionStatus = user.publicMetadata?.subscriptionStatus;
		const planType = user.publicMetadata?.planType;
		const subscriptionEndDate = user.publicMetadata?.subscriptionEndDate as
			| string
			| null;

		const isSubscriptionValid =
			subscriptionStatus === 'active' &&
			planType === 'Premium' &&
			(!subscriptionEndDate || new Date(subscriptionEndDate) > new Date());

		if (!isSubscriptionValid) {
			return {
				success: false,
				message: 'Se requiere una suscripción premium activa',
			};
		}

		const userId = user.id;

		// Verificar si ya está inscrito
		const existingEnrollment = await db.query.enrollmentPrograms.findFirst({
			where: and(
				eq(enrollmentPrograms.userId, userId),
				eq(enrollmentPrograms.programaId, programId)
			),
		});

		if (existingEnrollment) {
			return {
				success: false,
				message: 'Ya estás inscrito en este programa',
			};
		}

		// Crear la inscripción
		await db.insert(enrollmentPrograms).values({
			userId: userId,
			programaId: programId,
			enrolledAt: new Date(),
			completed: false,
		});

		return {
			success: true,
			message: 'Inscripción exitosa al programa',
		};
	} catch (error) {
		console.error('Error en enrollInProgram:', error);
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Error desconocido',
		};
	}
}

export async function isUserEnrolledInProgram(
	programId: number,
	userId: string
): Promise<boolean> {
	try {
		const existingEnrollment = await db.query.enrollmentPrograms.findFirst({
			where: and(
				eq(enrollmentPrograms.userId, userId),
				eq(enrollmentPrograms.programaId, programId)
			),
		});
		return !!existingEnrollment;
	} catch (error) {
		console.error('Error checking program enrollment:', error);
		throw new Error('Failed to check program enrollment status');
	}
}
