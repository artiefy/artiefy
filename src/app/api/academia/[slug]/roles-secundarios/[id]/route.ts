/**
 * /api/academia/[slug]/roles-secundarios/[id]  (super-admin de esa academia)
 *
 * PATCH  — mismo cuerpo que al crear.
 * DELETE — elimina el rol (y sus asignaciones).
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { registrarLog } from '~/server/academy/logs';
import { actualizarRol, eliminarRol } from '~/server/academy/roles-secundarios';

type Ctx = { params: Promise<{ slug: string; id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const nombre = await actualizarRol(academia.id, Number(id), body);
    await registrarLog(academia.id, 'Rol secundario editado', nombre);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'roles: editar');
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const nombre = await eliminarRol(academia.id, Number(id));
    await registrarLog(academia.id, 'Rol secundario eliminado', nombre);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'roles: eliminar');
  }
}
