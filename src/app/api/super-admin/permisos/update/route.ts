import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { permisos } from '~/server/db/schema';
import { authorizeRole } from '~/server/utils/apiAuth';

const ACCIONES = [
  'create',
  'read',
  'update',
  'delete',
  'approve',
  'assign',
  'publish',
] as const;

type Accion = (typeof ACCIONES)[number];

interface UpdatePermisoBody {
  id: number;
  name: string;
  description?: string;
  servicio: string;
  accion: Accion;
}

export async function PUT(req: Request) {
  try {
    // Security best practice: managing permissions is restricted to
    // admin/super-admin.
    const authz = await authorizeRole(['admin', 'super-admin']);
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado' },
        { status: authz.status }
      );
    }

    const body = (await req.json()) as UpdatePermisoBody;
    const { id, name, description, servicio, accion } = body;

    // Validaciones de tipo
    if (
      typeof id !== 'number' ||
      !name?.trim() ||
      !servicio?.trim() ||
      !ACCIONES.includes(accion)
    ) {
      return NextResponse.json(
        { error: 'Datos incompletos o inválidos' },
        { status: 400 }
      );
    }

    await db
      .update(permisos)
      .set({
        name,
        description,
        servicio,
        accion,
      })
      .where(eq(permisos.id, id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
