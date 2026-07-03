import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { roleSecundarioPermisos, rolesSecundarios } from '~/server/db/schema';
import { authorizeRole } from '~/server/utils/apiAuth';

interface UpdateRolBody {
  id: number;
  name: string;
  permisos?: number[];
}

export async function PUT(req: Request) {
  try {
    // Security best practice: managing roles is restricted to admin/super-admin.
    const authz = await authorizeRole(['admin', 'super-admin']);
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado' },
        { status: authz.status }
      );
    }

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
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
