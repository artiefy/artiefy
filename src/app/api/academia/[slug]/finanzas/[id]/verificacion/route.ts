/**
 * /api/academia/[slug]/finanzas/[id]/verificacion  (super-admin de esa academia)
 *
 * GET   — detalle del pago: comprobante, verificación e historial.
 * PATCH — { verificado, notas?, archivoKey?, archivoNombre? } verifica o
 *         rechaza; o { comprobanteKey, comprobanteNombre } sube el comprobante.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { registrarLog } from '~/server/academy/logs';
import { actualizarVerificacion, detallePago } from '~/server/academy/pagos';

type Ctx = { params: Promise<{ slug: string; id: string }> };

const resolver = async (params: Ctx['params']) => {
  const { slug, id } = await params;
  const r = await cuentaDeAcademia(slug, ['super-admin']);
  return { ...r, id: Number(id) };
};

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia, id } = await resolver(params);
    return NextResponse.json(await detallePago(academia.id, id));
  } catch (error) {
    return respuestaDeError(error, 'finanzas: detalle');
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, cuenta, id } = await resolver(params);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const accion = await actualizarVerificacion(
      academia.id,
      id,
      cuenta.name ?? cuenta.email,
      body
    );
    await registrarLog(academia.id, accion, `Pago #${id}`);
    return NextResponse.json(await detallePago(academia.id, id));
  } catch (error) {
    return respuestaDeError(error, 'finanzas: verificar');
  }
}
