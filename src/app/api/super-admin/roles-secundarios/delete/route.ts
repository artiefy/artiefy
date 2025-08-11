import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { roleSecundarioPermisos, rolesSecundarios } from '~/server/db/schema';

interface DeleteRolBody {
  id: number;
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as DeleteRolBody;
    const { id } = body;

    if (typeof id !== 'number') {
      return NextResponse.json(
        { error: 'ID requerido y debe ser un número' },
        { status: 400 }
      );
    }

    await db
      .delete(roleSecundarioPermisos)
      .where(eq(roleSecundarioPermisos.roleId, id));
    await db.delete(rolesSecundarios).where(eq(rolesSecundarios.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar rol secundario:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
