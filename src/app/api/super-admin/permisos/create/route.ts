import { NextResponse } from 'next/server';

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

interface PermisoBody {
  name: string;
  description?: string;
  servicio: string;
  accion: Accion;
}

export async function POST(req: Request) {
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

    const body = (await req.json()) as PermisoBody;
    const { name, description } = body;

    if (!name.trim() || !body.servicio || !body.accion) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    }

    if (
      !name.trim() ||
      !body.servicio.trim() ||
      !ACCIONES.includes(body.accion)
    ) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const created = await db
      .insert(permisos)
      .values({
        name,
        description,
        servicio: body.servicio,
        accion: body.accion,
      })
      .returning();

    // Tipar el resultado si es necesario:
    const permisoCreado = created[0] as { name: string; description?: string };

    return NextResponse.json(permisoCreado);
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
