'use server';

import { currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollmentPrograms } from '~/server/db/schema';

import type { NextApiRequest, NextApiResponse } from 'next';

export async function unenrollFromProgram(
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

		const result = await db
			.delete(enrollmentPrograms)
			.where(
				and(
					eq(enrollmentPrograms.userId, user.id),
					eq(enrollmentPrograms.programaId, programId)
				)
			);
		console.log('Unenrollment result:', result); // Debugging log

		if (!result) {
			return {
				success: false,
				message: 'No se encontró la inscripción',
			};
		}

		return {
			success: true,
			message: 'Inscripción cancelada exitosamente',
		};
	} catch (error) {
		console.error('Error en unenrollFromProgram:', error);
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Error desconocido',
		};
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
	console.log('Unenrolling from program:', programId); // Debugging log
	const result = await unenrollFromProgram(programId);
	if (result.success) {
		res.status(200).json(result);
	} else {
		res.status(400).json(result);
	}
}
