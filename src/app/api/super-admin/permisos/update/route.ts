import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { permisos } from '~/server/db/schema';

interface UpdatePermisoBody {
	id: number;
	name: string;
	description?: string;
}

export async function PUT(req: Request) {
	try {
		const body = (await req.json()) as UpdatePermisoBody;
		const { id, name, description } = body;

		if (typeof id !== 'number' || !name?.trim()) {
			return NextResponse.json(
				{ error: 'ID y nombre son requeridos y deben ser válidos' },
				{ status: 400 }
			);
		}

		await db
			.update(permisos)
			.set({ name, description })
			.where(eq(permisos.id, id));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error al actualizar permiso:', error);
		return NextResponse.json({ error: 'Error interno' }, { status: 500 });
	}
}
