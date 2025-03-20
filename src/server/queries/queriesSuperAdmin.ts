'use server';

import { unstable_cache } from 'next/cache';

import { clerkClient } from '@clerk/nextjs/server'; // Clerk Client
import { eq, desc, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	courses,
	categories,
	modalidades,
	nivel as nivel,
	programas,
	enrollmentPrograms,
} from '~/server/db/schema';

import type { Course, Program, Materia } from '~/types';


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
		const client = await clerkClient();
		await client.users.updateUser(id, {
			publicMetadata: { role }, // ✅ Actualiza el rol en Clerk
		});
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
		const client = await clerkClient();
		await client.users.deleteUser(id);
		console.log(`DEBUG: Usuario ${id} eliminado correctamente`);
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

export async function createUser(
	firstName: string,
	lastName: string,
	email: string,
	role: string
) {
	try {
		// 🔹 Obtener la primera letra del primer nombre y primer apellido
		const firstInitial = firstName.charAt(0).toLowerCase();
		const lastInitial = lastName?.split(' ')[0]?.charAt(0).toLowerCase() || 'x'; // 'x' si no hay apellido

		// 🔹 Generar la contraseña base (iniciales del nombre y apellido)
		let generatedPassword = `${firstInitial}${lastInitial}`;

		// 🔹 Si la contraseña es menor a 8 caracteres, agregar "12345678" hasta completar
		if (generatedPassword.length < 8) {
			generatedPassword += '12345678'.slice(0, 8 - generatedPassword.length);
		}

		// 🔹 Agregar un número aleatorio para evitar que la contraseña sea "pwned"
		const randomDigits = Math.floor(10 + Math.random() * 90); // Número entre 10 y 99
		generatedPassword += randomDigits;

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
		const client = await clerkClient();
		await client.users.updateUser(id, {
			publicMetadata: { status },
		});

		console.log(`DEBUG: Estado del usuario ${id} actualizado a ${status}`);
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
		for (const id of userIds) {
			await client.users.updateUser(id, {
				publicMetadata: { status },
			});
		}

		console.log(
			`DEBUG: Se actualizaron ${userIds.length} usuarios a estado ${status}`
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
				...courseData,
				instructor: courseData.instructor ?? 'Desconocido', // ✅ Evitar errores si instructor es null
				creatorId: courseData.creatorId || 'defaultCreatorId', // ✅ Manejo de creatorId
				createdAt: new Date(courseData.createdAt), // Convertir a Date
				updatedAt: courseData.updatedAt
					? new Date(courseData.updatedAt)
					: undefined, // Convertir a Date si existe
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

export interface ProgramData {
	id?: number;
	title: string;
	description?: string | null;
	coverImageKey?: string | null;
	categoryid: number;
	creatorId: string;
	createdAt: Date | string;
	updatedAt?: Date | string;
	rating?: number | null;
}

// Obtener todos los programas
export async function getPrograms(): Promise<ProgramData[]> {
	return db.select().from(programas).execute();
}

// Obtener un programa por ID
export const getProgramById = unstable_cache(
	async (id: string) => {
		const program = await db.query.programas.findFirst({
			where: eq(programas.id, parseInt(id, 10)),
			with: {
				materias: {
					with: {
						curso: true,
					},
				},
			},
		});

		if (!program) {
			throw new Error('Program not found');
		}

		const enrollmentCount = await db
			.select({ count: sql<number>`count(*)` })
			.from(enrollmentPrograms)
			.where(eq(enrollmentPrograms.programaId, parseInt(id, 10)))
			.then((result) => Number(result[0]?.count ?? 0));

			const transformedCourses: Course[] = program.materias
			.filter((materia) => materia.curso)
			.map((materia) => ({
				...materia.curso!,
				totalStudents: enrollmentCount,
				lessons: [],
				Nivelid: materia.curso!.nivelid,
			}));

		const transformedMaterias: Materia[] = program.materias.map((materia) => ({
			id: materia.id,
			title: materia.title,
			description: materia.description ?? '',
			programaId: materia.programaId,
			courseId: materia.curso?.id ?? 0,
			courseid: materia.curso?.id ?? 0,
			curso: materia.curso
				? {
						...materia.curso,
						Nivelid: materia.curso.nivelid,
						totalStudents: enrollmentCount,
						lessons: [],
				  }
				: null,
		}));

		const programData: Program = {
			id: program.id.toString(),
			title: program.title,
			description: program.description,
			coverImageKey: program.coverImageKey,
			createdAt: program.createdAt,
			updatedAt: program.updatedAt,
			creatorId: program.creatorId,
			rating: program.rating,
			categoryid: program.categoryid,
			materias: transformedMaterias,
		};

		return programData;
	},
	['program-by-id'],
	{
		revalidate: 3600,
		tags: ['programs'],
	}
);

// Crear un nuevo programa
export async function createProgram(
	programData: Partial<ProgramData>
): Promise<ProgramData> {
	const result = await db
		.insert(programas)
		.values({
			title: programData.title,
			categoryid: programData.categoryid!,
			creatorId: programData.creatorId!,
			description: programData.description ?? null,
			coverImageKey: programData.coverImageKey ?? null,
			createdAt: programData.createdAt ?? new Date(),
			updatedAt: programData.updatedAt ?? new Date(),
			rating: programData.rating ?? null,
		})
		.returning({
			id: programas.id,
			title: programas.title,
			description: programas.description,
			coverImageKey: programas.coverImageKey,
			categoryid: programas.categoryid,
			creatorId: programas.creatorId,
			createdAt: programas.createdAt,
			updatedAt: programas.updatedAt,
			rating: programas.rating,
		})
		.execute();
	return result[0];
}

// Actualizar un programa
export async function updateProgram(
	programId: number,
	programData: Partial<ProgramData>
): Promise<ProgramData> {
	const result = await db
		.update(programas)
		.set({
			title: programData.title,
			description: programData.description,
			coverImageKey: programData.coverImageKey,
			categoryid: programData.categoryid,
			creatorId: programData.creatorId,
			updatedAt: new Date(),
			rating: programData.rating,
		})
		.where(eq(programas.id, programId))
		.returning({
			id: programas.id,
			title: programas.title,
			description: programas.description,
			coverImageKey: programas.coverImageKey,
			categoryid: programas.categoryid,
			creatorId: programas.creatorId,
			createdAt: programas.createdAt,
			updatedAt: programas.updatedAt,
			rating: programas.rating,
		})
		.execute();
	return result[0];
}

// Eliminar un programa
export async function deleteProgram(programId: number): Promise<void> {
	await db.delete(programas).where(eq(programas.id, programId)).execute();
}

export {};
