import { and,eq, or } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses, users } from '~/server/db/schema';

export interface User {
	id: string;
	role: string;
	name: string | null;
	email: string;
	createdAt: Date;
	updatedAt: Date;
}

// Obtener usuario por ID
export async function getUserById(id: string): Promise<User | null> {
	const result = await db
		.select({
			id: users.id,
			role: users.role,
			name: users.name,
			email: users.email,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
		})
		.from(users)
		.where(eq(users.id, id))
		.limit(1);

	return result[0] ?? null;
}

// Obtener todos los usuarios
export async function getAllUsers(): Promise<User[]> {
	return db
		.select({
			id: users.id,
			role: users.role,
			name: users.name,
			email: users.email,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
		})
		.from(users);
}

// Crear un nuevo usuario
export async function createUser(
	id: string,
	role: 'estudiante' | 'educador' | 'admin' | 'super-admin',
	name: string,
	email: string
): Promise<boolean> {
	// Verificar si el usuario ya existe por id o combinación email+rol
	const existingUser = await db
		.select()
		.from(users)
		.where(
			or(eq(users.id, id), and(eq(users.email, email), eq(users.role, role)))
		)
		.limit(1);

	if (existingUser.length > 0) {
		console.log('🔍 Usuario ya existe en DB:', existingUser[0]);
		return false;
	}

	try {
		await db.insert(users).values({
			id,
			role,
			name,
			email,
		});
		console.log('✅ Usuario insertado correctamente:', { id, email, role });
		return true;
	} catch (error) {
		console.error('❌ Error al insertar usuario:', error);
		throw error;
	}
}

// eliminar un usuario by ID
export async function deleteUserById(id: string): Promise<void> {
	await db.transaction(async (trx) => {
		await trx.delete(courses).where(eq(courses.creatorId, id));
		await trx.delete(users).where(eq(users.id, id));
	});
}
