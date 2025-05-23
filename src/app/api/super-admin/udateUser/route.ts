import { NextResponse } from 'next/server';

import { updateUserInClerk } from '~/server/queries/queries';

// ✅ API Route para actualizar usuario en Clerk
export async function PATCH(req: Request) {
	try {
		// 🔹 Extraemos los datos del cuerpo de la solicitud
		const { userId, firstName, lastName, role, status, permissions } =
			(await req.json()) as {
				userId: string;
				firstName: string;
				lastName: string;
				role: string;
				status: string;
				permissions: string[];
			};

		// 🔍 Validaciones básicas
		if (!userId || !firstName?.trim() || !lastName?.trim()) {
			return NextResponse.json(
				{ error: 'Faltan datos obligatorios: userId, firstName o lastName' },
				{ status: 400 }
			);
		}

		// 🔹 Llamamos a nuestra función para actualizar en Clerk
		const updateSuccess = await updateUserInClerk({
			userId,
			firstName,
			lastName,
			role,
			status,
			permissions,
		});

		if (!updateSuccess) {
			return NextResponse.json(
				{ error: 'Error al actualizar usuario en Clerk' },
				{ status: 500 }
			);
		}

		// ✅ Si todo sale bien, respondemos con los datos actualizados
		return NextResponse.json({
			success: true,
			message: 'Usuario actualizado correctamente en Clerk',
			updatedUser: {
				userId,
				firstName,
				lastName,
				role,
				status,
				permissions,
			},
		});
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido';

		console.error('❌ Error en la API de actualización:', errorMessage);

		return NextResponse.json(
			{ error: `Error interno del servidor: ${errorMessage}` },
			{ status: 500 }
		);
	}
}
