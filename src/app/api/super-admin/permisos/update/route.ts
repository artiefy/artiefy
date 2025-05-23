import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { permisos } from '~/server/db/schema';

interface UpdatePermisoBody {
	id: number;
	name: string;
	description?: string;
	servicio: string;
	accion: string;
}

export async function PUT(req: Request) {
	try {
		const body = (await req.json()) as UpdatePermisoBody;
		const { id, name, description } = body;

		if (
			typeof id !== 'number' ||
			!name?.trim() ||
			!body.servicio ||
			!body.accion
		) {
			return NextResponse.json(
				{ error: 'Todos los campos son requeridos' },
				{ status: 400 }
			);
		}

		await db
			.update(permisos)
			.set({
				name,
				description,
				servicio: body.servicio,
				accion: body.accion,
			})
			.where(eq(permisos.id, id));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error al actualizar permiso:', error);
		return NextResponse.json({ error: 'Error interno' }, { status: 500 });
	}
}
