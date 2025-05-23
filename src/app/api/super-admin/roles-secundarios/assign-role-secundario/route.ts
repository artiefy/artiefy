import { NextResponse } from 'next/server';

import { clerkClient } from '@clerk/nextjs/server';
import { eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	rolesSecundarios,
	roleSecundarioPermisos,
	permisos,
	users,
} from '~/server/db/schema';

interface AssignRoleBody {
	userId: string;
	roleSecundarioId: number;
}

export async function PATCH(req: Request) {
	try {
		const body = (await req.json()) as AssignRoleBody;
		const { userId, roleSecundarioId } = body;

		if (typeof userId !== 'string' || typeof roleSecundarioId !== 'number') {
			return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
		}

		const role = await db.query.rolesSecundarios.findFirst({
			where: eq(rolesSecundarios.id, roleSecundarioId),
		});

		if (!role) {
			return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
		}

		const permisoIds = await db
			.select()
			.from(roleSecundarioPermisos)
			.where(eq(roleSecundarioPermisos.roleId, roleSecundarioId));

		const permisoDetails = await db
			.select()
			.from(permisos)
			.where(
				inArray(
					permisos.id,
					permisoIds.map((p) => p.permisoId)
				)
			);

		const permisoNames = permisoDetails.map((p) => p.name);

		const clerk = await clerkClient();
		const clerkUser = await clerk.users.updateUser(userId, {
			publicMetadata: {
				role_secundario: role.name,
				permisos_secundarios: permisoNames,
			},
		});

		await db
			.update(users)
			.set({ updatedAt: new Date() })
			.where(eq(users.id, userId));

		return NextResponse.json({
			success: true,
			role_secundario: role.name,
		});
	} catch (error) {
		console.error('Error al asignar rol secundario:', error);
		return NextResponse.json({ error: 'Error interno' }, { status: 500 });
	}
}
