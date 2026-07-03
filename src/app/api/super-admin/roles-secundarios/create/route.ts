import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { roleSecundarioPermisos, rolesSecundarios } from '~/server/db/schema';
import { authorizeRole } from '~/server/utils/apiAuth';

interface CreateRoleBody {
  name: string;
  permisos?: number[];
}

export async function POST(req: Request) {
  try {
    // Security best practice: managing roles is restricted to admin/super-admin.
    const authz = await authorizeRole(['admin', 'super-admin']);
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado' },
        { status: authz.status }
      );
    }

    const body = (await req.json()) as CreateRoleBody;

    const { name, permisos } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    }

    const inserted = await db
      .insert(rolesSecundarios)
      .values({ name })
      .returning();

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
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
