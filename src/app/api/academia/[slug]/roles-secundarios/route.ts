/**
 * /api/academia/[slug]/roles-secundarios  (super-admin de esa academia)
 *
 * GET  — roles secundarios con sus cuentas asignadas.
 * POST — { nombre, permisos[], academyUserIds[] } crea un rol.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { registrarLog } from '~/server/academy/logs';
import { crearRol, listarRoles } from '~/server/academy/roles-secundarios';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    return NextResponse.json({ roles: await listarRoles(academia.id) });
  } catch (error) {
    return respuestaDeError(error, 'roles: listar');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const nuevo = await crearRol(academia.id, body);
    await registrarLog(academia.id, 'Rol secundario creado', nuevo.nombre);
    return NextResponse.json({ ok: true, id: nuevo.id }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error, 'roles: crear');
  }
}
