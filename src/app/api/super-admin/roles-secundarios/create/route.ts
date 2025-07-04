import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { roleSecundarioPermisos,rolesSecundarios } from '~/server/db/schema';

interface CreateRoleBody {
	name: string;
	permisos?: number[];
}

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as CreateRoleBody;
		console.log('Body recibido:', body);

		const { name, permisos } = body;

		if (!name?.trim()) {
			return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
		}

		const inserted = await db
			.insert(rolesSecundarios)
			.values({ name })
			.returning();

		console.log('Insert result:', inserted);

		const newRole = inserted[0];
		if (!newRole) throw new Error('No se insertó el rol');

		if (Array.isArray(permisos) && permisos.length > 0) {
			const relations = permisos.map((permisoId) => ({
				roleId: newRole.id,
				permisoId,
			}));

			await db.insert(roleSecundarioPermisos).values(relations);
		}

		return NextResponse.json({
			...newRole,
			permisos: permisos ?? [],
		});
	} catch (error) {
		console.error('Error al crear rol secundario:', error);
		return NextResponse.json({ error: 'Error interno' }, { status: 500 });
	}
}
