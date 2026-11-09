/**
 * /api/academia/[slug]/finanzas/[id]  (super-admin de esa academia)
 *
 * PATCH  — { estado } cambia el estado del pago.
 * DELETE — elimina el registro.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { registrarLog } from '~/server/academy/logs';
import { cambiarEstadoPago, eliminarPago } from '~/server/academy/pagos';

type Ctx = { params: Promise<{ slug: string; id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const body = (await request.json().catch(() => ({}))) as {
      estado?: unknown;
    };
    const detalle = await cambiarEstadoPago(
      academia.id,
      Number(id),
      body.estado
    );
    await registrarLog(academia.id, 'Pago actualizado', detalle);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'finanzas: estado');
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const concepto = await eliminarPago(academia.id, Number(id));
    await registrarLog(academia.id, 'Pago eliminado', concepto);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'finanzas: eliminar');
  }
}
