import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { roleSecundarioPermisos, rolesSecundarios } from '~/server/db/schema';
import { authorizeRole } from '~/server/utils/apiAuth';

interface DeleteRolBody {
  id: number;
}

export async function DELETE(req: Request) {
  try {
    // Security best practice: managing roles is restricted to admin/super-admin.
    const authz = await authorizeRole(['admin', 'super-admin']);
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado' },
        { status: authz.status }
      );
    }

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
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
