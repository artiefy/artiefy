'use server';

import { currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollmentPrograms } from '~/server/db/schema';

export async function unenrollFromProgram(
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

		const result = await db
			.delete(enrollmentPrograms)
			.where(
				and(
					eq(enrollmentPrograms.userId, user.id),
					eq(enrollmentPrograms.programaId, programId)
				)
			);

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
