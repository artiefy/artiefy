// /api/super-admin/roles-secundarios/list/route.ts

import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { roleSecundarioPermisos, rolesSecundarios } from '~/server/db/schema';

export async function GET() {
  try {
    const roles = await db.select().from(rolesSecundarios);

    const rolesWithPermisos = await Promise.all(
      roles.map(async (rol) => {
        const permisosAsignados = await db
          .select()
          .from(roleSecundarioPermisos)
          .where(eq(roleSecundarioPermisos.roleId, rol.id));

        const permisosIds = permisosAsignados.map((p) => p.permisoId);

        return {
          ...rol,
          permisos: permisosIds, // ✅ Solo los IDs
        };
      })
    );

    return NextResponse.json(rolesWithPermisos);
  } catch (error) {
    console.error('Error al listar roles secundarios:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
