'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';

export async function syncUser() {
	const user = await currentUser();

	if (!user) {
		throw new Error('No se encontró un usuario autenticado');
	}

	try {
		const userData = {
			id: user.id,
			role: 'student',
			name:
				user.firstName && user.lastName
					? `${user.firstName} ${user.lastName}`
					: (user.username ?? ''),
			email: user.emailAddresses[0]?.emailAddress ?? '',
			createdAt: new Date(user.createdAt),
			updatedAt: new Date(),
			phone: user.phoneNumbers[0]?.phoneNumber ?? null,
			country: null,
			city: null,
			address: null,
			age: null,
			birthDate: null,
		};

		const existingUser = await db.query.users.findFirst({
			where: eq(users.id, user.id),
		});

		if (existingUser) {
			// Actualizar usuario existente
			await db.update(users).set(userData).where(eq(users.id, user.id));
		} else {
			// Crear nuevo usuario
			await db.insert(users).values(userData);
		}

		return {
			success: true,
			message: 'Usuario sincronizado correctamente',
			userId: user.id,
		};
	} catch (error) {
		console.error('Error al sincronizar usuario:', error);
		throw new Error('No se pudo sincronizar el usuario');
	}
}

export async function getUserRole(userId: string): Promise<string | null> {
	try {
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
			columns: { role: true },
		});

		return user?.role ?? null;
	} catch (error) {
		console.error('Error al obtener el rol del usuario:', error);
		return null;
	}
}
