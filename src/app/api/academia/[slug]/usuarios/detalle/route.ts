/**
 * /api/academia/[slug]/usuarios/detalle  (super-admin de esa academia)
 *
 * GET   — todas las cuentas con datos, cursos y roles secundarios, y la lista
 *         de roles secundarios de la academia ("Administrador de usuarios").
 * PATCH — { userIds[], campo, valor } guarda un dato (teléfono, profesión,
 *         descripción…) de una o varias cuentas.
 * PUT   — { userId, rolIds[] } roles secundarios ("Permisos") de una cuenta.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { guardarDato } from '~/server/academy/estudiantes';
import { registrarLog } from '~/server/academy/logs';
import { listarRoles } from '~/server/academy/roles-secundarios';
import {
  asignarRolesSecundarios,
  listarUsuariosDetalle,
} from '~/server/academy/usuarios-detalle';

type Ctx = { params: Promise<{ slug: string }> };

const resolver = async (params: Ctx['params']) =>
  cuentaDeAcademia((await params).slug, ['super-admin']);

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await resolver(params);
    const [usuarios, roles] = await Promise.all([
      listarUsuariosDetalle(academia.id),
      listarRoles(academia.id).catch(() => []),
    ]);
    return NextResponse.json({
      usuarios,
      roles: roles.map((r) => ({ id: r.id, nombre: r.nombre })),
    });
  } catch (error) {
    return respuestaDeError(error, 'usuarios: detalle');
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await resolver(params);
    const body = (await request.json().catch(() => ({}))) as {
      userIds?: unknown;
      campo?: unknown;
      valor?: unknown;
    };
    const userIds = Array.isArray(body.userIds)
      ? body.userIds.filter((v): v is string => typeof v === 'string')
      : [];
    const cambiados = await guardarDato(
      academia.id,
      userIds,
      typeof body.campo === 'string' ? body.campo : '',
      typeof body.valor === 'string' ? body.valor : '',
      false
    );
    return NextResponse.json({ ok: true, cambiados });
  } catch (error) {
    return respuestaDeError(error, 'usuarios: guardar dato');
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await resolver(params);
    const body = (await request.json().catch(() => ({}))) as {
      userId?: unknown;
      rolIds?: unknown;
    };
    const userId = typeof body.userId === 'string' ? body.userId : '';
    const rolIds = Array.isArray(body.rolIds)
      ? body.rolIds.map(Number).filter(Number.isInteger)
      : [];
    await asignarRolesSecundarios(academia.id, userId, rolIds);
    await registrarLog(
      academia.id,
      'Permisos actualizados',
      `${userId}: ${rolIds.length} rol(es) secundario(s)`
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'usuarios: permisos');
  }
}
