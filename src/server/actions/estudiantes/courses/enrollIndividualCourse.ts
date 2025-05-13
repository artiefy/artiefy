'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { users, enrollments } from '~/server/db/schema';

export async function enrollUserInCourse(userEmail: string, courseId: number) {
	try {
		// Buscar el usuario por email
		const user = await db.query.users.findFirst({
			where: eq(users.email, userEmail),
		});

		if (!user) {
			throw new Error(`Usuario no encontrado con email: ${userEmail}`);
		}

		// Crear la inscripción permanente
		await db.insert(enrollments).values({
			userId: user.id,
			courseId: courseId,
			enrolledAt: new Date(),
			completed: false,
			isPermanent: true,
		});

		console.log('✅ Usuario inscrito permanentemente en el curso:', {
			userEmail,
			courseId,
		});

		return { success: true };
	} catch (error) {
		console.error('❌ Error al inscribir usuario en curso:', error);
		throw new Error(
			error instanceof Error ? error.message : 'Error desconocido'
		);
	}
}
