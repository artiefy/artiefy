import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { rolesSecundarios, roleSecundarioPermisos } from '~/server/db/schema';

interface UpdateRolBody {
	id: number;
	name: string;
	permisos?: number[];
}

export async function PUT(req: Request) {
	try {
		const body = (await req.json()) as UpdateRolBody;
		const { id, name, permisos } = body;

		if (typeof id !== 'number' || !name?.trim()) {
			return NextResponse.json(
				{ error: 'Datos incompletos o inválidos' },
				{ status: 400 }
			);
		}

		await db
			.update(rolesSecundarios)
			.set({ name })
			.where(eq(rolesSecundarios.id, id));

		await db
			.delete(roleSecundarioPermisos)
			.where(eq(roleSecundarioPermisos.roleId, id));

		if (Array.isArray(permisos) && permisos.length > 0) {
			const relaciones = permisos.map((permisoId) => ({
				roleId: id,
				permisoId,
			}));
			await db.insert(roleSecundarioPermisos).values(relaciones);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error al actualizar rol secundario:', error);
		return NextResponse.json({ error: 'Error interno' }, { status: 500 });
	}
}
