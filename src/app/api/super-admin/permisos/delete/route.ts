import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { permisos } from '~/server/db/schema';

interface DeletePermisoBody {
	id: number;
}

export async function DELETE(req: Request) {
	try {
		const body = (await req.json()) as DeletePermisoBody;
		const { id } = body;

		if (typeof id !== 'number') {
			return NextResponse.json({ error: 'ID requerido y debe ser un número' }, { status: 400 });
		}

		await db.delete(permisos).where(eq(permisos.id, id));
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error al eliminar permiso:', error);
		return NextResponse.json({ error: 'Error interno' }, { status: 500 });
	}
}
