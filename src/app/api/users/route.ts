// src/app/api/users/route.ts

import { NextResponse } from 'next/server';

import { db } from '~/server/db'; // Asegúrate de importar correctamente la conexión de Drizzle
import { users } from '~/server/db/schema';
import {
	createUser,
	getAdminUsers,
	deleteUser,
	setRoleWrapper,
	removeRole,
	updateUserInfo,
	updateUserStatus,
	updateMultipleUserStatus,
} from '~/server/queries/queries';

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const query = searchParams.get('search') ?? '';
		const users = await getAdminUsers(query);

		// 🔹 Recuperar el tiempo desde localStorage en el servidor no es posible directamente.
		// 🔹 Lo manejaremos desde el frontend.
		const usersWithTime = users.map((user) => ({
			...user,
			timeSpent: 0, // El frontend lo llenará
		}));

		return NextResponse.json(usersWithTime);
	} catch (error: unknown) {
		if (error instanceof Error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}
		return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		// 1. Obtener datos del request
		interface RequestBody {
			firstName: string;
			lastName: string;
			email: string;
			role: string;
		}
		const { firstName, lastName, email, role }: RequestBody =
			(await request.json()) as RequestBody;

		// 2. Crear usuario en Clerk
		const { user, generatedPassword } = await createUser(
			firstName,
			lastName,
			email,
			role
		);

		// 3. Guardar usuario en la base de datos con Drizzle
		await db.insert(users).values({
			id: user.id,
			role: role || 'estudiante',
			name: `${firstName} ${lastName}`,
			email:
				user.emailAddresses.find(
					(addr) => addr.id === user.primaryEmailAddressId
				)?.emailAddress ?? email,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		console.log('✅ Usuario guardado en la BD correctamente');

		// 4. Preparar usuario seguro para la respuesta
		const safeUser = {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			username: user.username, // <-- Clerk no tiene `username` por defecto, asegúrate de que exista
			email: user.emailAddresses.find(
				(addr) => addr.id === user.primaryEmailAddressId
			)?.emailAddress,
			role: user.publicMetadata?.role || 'estudiante',
		};

		return NextResponse.json({
			user: safeUser,
			generatedPassword,
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error('Error al registrar usuario:', error);
			return NextResponse.json({ error: error.message }, { status: 400 });
		}
		return NextResponse.json({ error: 'Unknown error' }, { status: 400 });
	}
}

// DELETE /api/users?id=xxx (para eliminar usuario)
export async function DELETE(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get('id');
		if (!userId) {
			return NextResponse.json(
				{ error: 'Falta el parámetro id' },
				{ status: 400 }
			);
		}
		await deleteUser(userId);
		return NextResponse.json({ success: true });
	} catch (error: unknown) {
		if (error instanceof Error) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}
		return NextResponse.json({ error: 'Unknown error' }, { status: 400 });
	}
}

// PATCH /api/users (para actualizar algo: rol, nombre, etc.)
export async function PATCH(request: Request) {
	try {
		interface RequestBody {
			action: string;
			id: string;
			role?: string;
			firstName?: string;
			lastName?: string;
			userIds?: string[];
			status?: string;
		}
		const body: RequestBody = (await request.json()) as RequestBody;
		const { action, id, role, firstName, lastName, userIds, status } = body;

		if (action === 'setRole') {
			if (!role) {
				return NextResponse.json(
					{ error: 'Role is required' },
					{ status: 400 }
				);
			}
			await setRoleWrapper({ id, role });
			return NextResponse.json({ success: true });
		}
		if (action === 'removeRole') {
			const { userIds } = body;
			if (!userIds || !Array.isArray(userIds)) {
				return NextResponse.json(
					{ error: 'Faltan userIds o no es un array' },
					{ status: 400 }
				);
			}

			for (const userId of userIds) {
				await removeRole(userId);
			}

			return NextResponse.json({ success: true });
		}

		if (action === 'updateUserInfo') {
			if (firstName && lastName) {
				await updateUserInfo(id, firstName, lastName);
				return NextResponse.json({ success: true });
			} else {
				return NextResponse.json(
					{ error: 'First name and last name are required' },
					{ status: 400 }
				);
			}
			return NextResponse.json({ success: true });
		}

		if (action === 'updateStatus') {
			if (typeof status === 'string') {
				await updateUserStatus(id, status);
				return NextResponse.json({ success: true });
			} else {
				return NextResponse.json(
					{ error: 'Status is required and must be a string' },
					{ status: 400 }
				);
			}
			return NextResponse.json({ success: true });
		}

		if (action === 'updateMultipleStatus') {
			if (userIds) {
				if (typeof status === 'string') {
					await updateMultipleUserStatus(userIds, status);
				} else {
					return NextResponse.json(
						{ error: 'Status is required and must be a string' },
						{ status: 400 }
					);
				}
			} else {
				return NextResponse.json(
					{ error: 'userIds is required' },
					{ status: 400 }
				);
			}
			return NextResponse.json({ success: true });
		}

		return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 });
	} catch (error: unknown) {
		if (error instanceof Error) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}
		return NextResponse.json({ error: 'Unknown error' }, { status: 400 });
	}
}
