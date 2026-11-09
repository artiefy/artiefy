/**
 * /api/academia/[slug]/finanzas  (super-admin de esa academia)
 *
 * GET  — pagos registrados.
 * POST — { userId, concepto, monto, fecha (YYYY-MM-DD), metodo?, estado? }
 *        registra un pago (manual; no pasa por PayU).
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { registrarLog } from '~/server/academy/logs';
import { listarPagos, registrarPago } from '~/server/academy/pagos';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    return NextResponse.json({ pagos: await listarPagos(academia.id) });
  } catch (error) {
    return respuestaDeError(error, 'finanzas: listar');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, cuenta } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const nuevo = await registrarPago(academia.id, cuenta.userId, body);
    await registrarLog(academia.id, 'Pago registrado', nuevo.detalle);
    return NextResponse.json({ ok: true, id: nuevo.id }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error, 'finanzas: registrar');
  }
}
