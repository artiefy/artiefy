'use server';

import { clerkClient } from '@clerk/nextjs/server'; // Clerk Client
import { eq, desc } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	courses,
	categories,
	modalidades,
	nivel as nivel,
	materias,
	users,
} from '~/server/db/schema';

// Función para verificar el rol de admin y obtener usuarios
export async function getAdminUsers(query: string | undefined) {
	console.log('DEBUG: Ejecutando getAdminUsers con query ->', query);
	const client = await clerkClient();
	const usersResponse = await client.users.getUserList({ limit: 100 });
	const users = usersResponse.data;

	const filteredUsers = query
		? users.filter(
				(user) =>
					(user.firstName ?? '').toLowerCase().includes(query.toLowerCase()) ||
					(user.lastName ?? '').toLowerCase().includes(query.toLowerCase()) ||
					user.emailAddresses.some((email) =>
						email.emailAddress.toLowerCase().includes(query.toLowerCase())
					)
			)
		: users;

	const simplifiedUsers = filteredUsers.map((user) => ({
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.emailAddresses.find(
			(email) => email.id === user.primaryEmailAddressId
		)?.emailAddress,
		role: user.publicMetadata.role ?? 'estudiante',
		status: user.publicMetadata.status ?? 'activo', // ✅ Agregar estado con valor por defecto
	}));

	return simplifiedUsers;
}

// ✅ Función para actualizar el rol de un usuario
export async function setRoleWrapper({
	id,
	role,
}: {
	id: string;
	role: string;
}) {
	try {
		// Update in Clerk
		const client = await clerkClient();
		await client.users.updateUser(id, {
			publicMetadata: { role },
		});

		// Update in database
		await db
			.update(users)
			.set({
				role: role as 'estudiante' | 'educador' | 'admin' | 'super-admin',
				updatedAt: new Date(),
			})
			.where(eq(users.id, id));

		console.log(`DEBUG: Rol actualizado para usuario ${id} en Clerk y BD`);
	} catch (error) {
		console.error('Error al actualizar el rol:', error);
		throw new Error('No se pudo actualizar el rol');
	}
}

// ✅ Función para eliminar el rol de un usuario
export async function removeRole(id: string) {
	try {
		const client = await clerkClient();
		await client.users.updateUser(id, {
			publicMetadata: {}, // 🔥 Esto elimina el campo role correctamente
		});
		console.log(`DEBUG: Rol eliminado para el usuario ${id}`);
	} catch (error) {
		console.error('Error al eliminar rol:', error);
		throw new Error('No se pudo eliminar el rol');
	}
}

export async function deleteUser(id: string) {
	try {
		// Delete from Clerk
		const client = await clerkClient();
		await client.users.deleteUser(id);

		// Delete from database
		await db.delete(users).where(eq(users.id, id));

		console.log(`DEBUG: Usuario ${id} eliminado correctamente de Clerk y BD`);
	} catch (error) {
		console.error('Error al eliminar usuario:', error);
		throw new Error('No se pudo eliminar el usuario');
	}
}

export async function updateUserInfo(
	id: string,
	firstName: string,
	lastName: string
) {
	try {
		const client = await clerkClient();
		await client.users.updateUser(id, { firstName, lastName });
		console.log(`DEBUG: Usuario ${id} actualizado correctamente`);
	} catch (error) {
		console.error('Error al actualizar usuario:', error);
		throw new Error('No se pudo actualizar el usuario');
	}
}

function generateSecurePassword(length = 14): string {
	const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
	const lowercase = 'abcdefghjkmnpqrstuvwxyz';
	const numbers = '23456789';
	const symbols = '!@#$%^&*()_+-={}[]<>?';

	const allChars = uppercase + lowercase + numbers + symbols;

	let password = '';
	// Asegurar al menos un carácter de cada tipo
	password += uppercase[Math.floor(Math.random() * uppercase.length)];
	password += lowercase[Math.floor(Math.random() * lowercase.length)];
	password += numbers[Math.floor(Math.random() * numbers.length)];
	password += symbols[Math.floor(Math.random() * symbols.length)];

	// Completar el resto de la contraseña
	for (let i = password.length; i < length; i++) {
		password += allChars[Math.floor(Math.random() * allChars.length)];
	}

	// Mezclar la contraseña para evitar patrones predecibles
	return password
		.split('')
		.sort(() => 0.5 - Math.random())
		.join('');
}

export async function createUser(
	firstName: string,
	lastName: string,
	email: string,
	role: string
) {
	try {
		const generatedPassword = generateSecurePassword();

		// 🔹 Generar un nombre de usuario válido (mínimo 4 caracteres, máximo 64)
		let username = `${firstName}${lastName?.split(' ')[0] || ''}`.toLowerCase();
		if (username.length < 4) username += 'user';
		username = username.slice(0, 64);

		const client = await clerkClient();
		const newUser = await client.users.createUser({
			firstName,
			lastName,
			username,
			password: generatedPassword,
			emailAddress: [email],
			publicMetadata: { role, mustChangePassword: true },
		});

		console.log(
			`DEBUG: Usuario ${newUser.id} creado con contraseña: ${generatedPassword}`
		);
		return { user: newUser, generatedPassword };
	} catch (error: unknown) {
		console.error(
			'DEBUG: Error al crear usuario en Clerk:',
			JSON.stringify(error, null, 2)
		);
		throw new Error(
			(error as { message: string }).message || 'No se pudo crear el usuario'
		);
	}
}

export async function updateUserStatus(id: string, status: string) {
	try {
		// Update in Clerk
		const client = await clerkClient();
		await client.users.updateUser(id, {
			publicMetadata: { status },
		});

		// Update in database
		await db
			.update(users)
			.set({
				subscriptionStatus: status,
				updatedAt: new Date(),
			})
			.where(eq(users.id, id));

		console.log(
			`DEBUG: Estado del usuario ${id} actualizado a ${status} en Clerk y BD`
		);
	} catch (error) {
		console.error('Error al actualizar el estado del usuario:', error);
		throw new Error('No se pudo actualizar el estado del usuario');
	}
}

export async function updateMultipleUserStatus(
	userIds: string[],
	status: string
) {
	try {
		const client = await clerkClient();

		// Update both Clerk and database for each user
		for (const id of userIds) {
			// Update in Clerk
			await client.users.updateUser(id, {
				publicMetadata: { status },
			});

			// Update in database
			await db
				.update(users)
				.set({
					subscriptionStatus: status,
					updatedAt: new Date(),
				})
				.where(eq(users.id, id));
		}

		console.log(
			`DEBUG: Se actualizaron ${userIds.length} usuarios a estado ${status} en Clerk y BD`
		);
	} catch (error) {
		console.error('Error al actualizar múltiples usuarios:', error);
		throw new Error('No se pudieron actualizar los usuarios');
	}
}

export interface CourseData {
	id?: number;
	title: string;
	description?: string | null; // 🔹 Permitir `null` y hacerla opcional
	coverImageKey: string | null; // 🔹 Permitir `null` y hacerla opcional
	categoryid: number;
	modalidadesid: number;
	nivelid: number;
	instructor: string;
	creatorId: string;
	createdAt: Date | string; // 🔹 Permitir `string` porque en errores previos llegaba como `string`
	updatedAt?: Date | string; // 🔹 Hacer opcional y permitir `string` porque en errores previos faltaba
	rating?: number | null;
	courseTypeId?: number; // 🔹 Add courseTypeId as an optional property
	isActive?: boolean; // 🔹 Add isActive as an optional property
}

export interface Materia {
	id: number;
	title: string;
	description: string;
	programaId: number;
	courseid: number;
}

export async function getCourses() {
	try {
		return await db.select().from(courses).orderBy(desc(courses.createdAt));
	} catch (error) {
		console.error('❌ Error al obtener cursos:', error);
		return [];
	}
}

export async function deleteCourse(courseId: number) {
	try {
		return await db.delete(courses).where(eq(courses.id, courseId)).returning();
	} catch (error) {
		console.error('❌ Error al eliminar curso:', error);
		throw new Error('No se pudo eliminar el curso');
	}
}

export async function getModalidades() {
	try {
		const data = await db.select().from(modalidades);
		return data || []; // ✅ Devuelve un array vacío si `data` es `undefined`
	} catch (error) {
		console.error('❌ Error al obtener modalidades:', error);
		return [];
	}
}

// ✅ Función corregida con el tipo adecuado para `courseData`
export async function createCourse(courseData: CourseData) {
	try {
		return await db
			.insert(courses)
			.values({
				title: courseData.title,
				categoryid: courseData.categoryid,
				instructor: courseData.instructor,
				modalidadesid: courseData.modalidadesid,
				nivelid: courseData.nivelid,
				creatorId: courseData.creatorId || 'defaultCreatorId',
				createdAt: new Date(courseData.createdAt),
				updatedAt: courseData.updatedAt
					? new Date(courseData.updatedAt)
					: new Date(),
				courseTypeId: courseData.courseTypeId ?? 1, // <-- Aquí colocas un valor seguro por defecto
				isActive: courseData.isActive ?? true,
			})
			.returning();
	} catch (error) {
		console.error('❌ Error al crear curso:', error);
		throw new Error('No se pudo crear el curso');
	}
}

// ✅ Función corregida con `courseId: number`
export async function updateCourse(courseId: number, courseData: CourseData) {
	try {
		return await db
			.update(courses)
			.set({
				...courseData,
				createdAt: new Date(courseData.createdAt),
				updatedAt: courseData.updatedAt
					? new Date(courseData.updatedAt)
					: undefined,
			})
			.where(eq(courses.id, courseId))
			.returning();
	} catch (error) {
		console.error('❌ Error al actualizar curso:', error);
		throw new Error('No se pudo actualizar el curso');
	}
}

// ✅ Obtener todas las categorías
export async function getCategories() {
	try {
		return (await db.select().from(categories)) || [];
	} catch (error) {
		console.error('❌ Error al obtener categorías:', error);
		return [];
	}
}

// ✅ Obtener todas las
export async function getNivel() {
	try {
		return (await db.select().from(nivel)) || [];
	} catch (error) {
		console.error('❌ Error al obtener niveles:', error);
		return [];
	}
}

export async function updateUserInClerk({
	userId,
	firstName,
	lastName,
	role,
	status,
	permissions,
}: {
	userId: string;
	firstName: string;
	lastName: string;
	role: string;
	status: string;
	permissions: string[];
}) {
	try {
		const client = await clerkClient();

		// 🔥 Aseguramos que Clerk reciba TODOS los valores correctamente
		const updatedUser = await client.users.updateUser(userId, {
			firstName,
			lastName,
			publicMetadata: {
				role: role || 'estudiante', // Valor por defecto si no existe
				status: status || 'activo',
				permissions: Array.isArray(permissions) ? permissions : [], // Validar array
			},
		});

		console.log(
			`✅ Usuario ${userId} actualizado correctamente en Clerk.`,
			updatedUser
		);
		return true;
	} catch (error) {
		console.error('❌ Error al actualizar usuario en Clerk:', error);
		return false;
	}
}
export async function getMateriasByCourseId(
	courseId: string
): Promise<Materia[]> {
	try {
		const result = await db
			.select()
			.from(materias)
			.where(eq(materias.courseid, parseInt(courseId)));
		return result as Materia[];
	} catch (error) {
		console.error('Error fetching materias:', error);
		return [];
	}
}

// Add this new function to get category name by ID
export async function getCategoryNameById(id: number): Promise<string> {
	try {
		const category = await db
			.select()
			.from(categories)
			.where(eq(categories.id, id));
		return category[0]?.name ?? 'Unknown Category';
	} catch (error) {
		console.error('Error getting category name:', error);
		return 'Unknown Category';
	}
}

// Update this function to get instructor name from users table
export async function getInstructorNameById(id: string): Promise<string> {
	try {
		const user = await db
			.select()
			.from(users)
			.where(eq(users.id, id))
			.limit(1);

		if (user?.[0]?.name) {
			return user[0].name;
		}

		// Fallback to Clerk if not found in local DB
		const client = await clerkClient();
		const clerkUser = await client.users.getUser(id);
		return (
			`${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() ||
			'Unknown Instructor'
		);
	} catch (error) {
		console.error('Error getting instructor name:', error);
		return 'Unknown Instructor';
	}
}
export {};
