'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { type NextApiRequest, type NextApiResponse } from 'next';

import { db } from '~/server/db';
import { users, enrollmentPrograms } from '~/server/db/schema';

export async function enrollInProgram(
	programId: number
): Promise<{ success: boolean; message: string }> {
	try {
		const user = await currentUser();
		console.log('Current user:', user); // Debugging log

		if (!user?.id) {
			return {
				success: false,
				message: 'Usuario no autenticado',
			};
		}

		const userId = user.id;

		// Verificar si el usuario tiene un plan premium
		const dbUser = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});
		console.log('Database user:', dbUser); // Debugging log

		if (!dbUser?.subscriptionStatus || dbUser.subscriptionStatus !== 'active') {
			return {
				success: false,
				message: 'Se requiere una suscripción premium activa',
			};
		}

		// Verificar si ya está inscrito
		const existingEnrollment = await db.query.enrollmentPrograms.findFirst({
			where: and(
				eq(enrollmentPrograms.userId, userId),
				eq(enrollmentPrograms.programaId, programId)
			),
		});
		console.log('Existing enrollment:', existingEnrollment); // Debugging log

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
		console.log('Enrollment created'); // Debugging log

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
		console.log('Querying enrollment for user:', { programId, userId }); // Debugging log
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

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	console.log('Request method:', req.method); // Debugging log
	if (req.method !== 'POST') {
		res.setHeader('Allow', ['POST']);
		return res
			.status(405)
			.json({ message: `Method ${req.method} not allowed` });
	}

	const { programId } = req.body as { programId: number };
	console.log('Enrolling in program:', programId); // Debugging log
	const result = await enrollInProgram(programId);
	if (result.success) {
		res.status(200).json(result);
	} else {
		res.status(400).json(result);
	}
}
