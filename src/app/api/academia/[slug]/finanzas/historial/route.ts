/**
 * GET /api/academia/[slug]/finanzas/historial  (super-admin de esa academia)
 *
 * Historial de Transacciones (como /api/transaction-history de Artiefy):
 * ?q&verified=all|true|false&from&to&method&concepto&page&pageSize →
 * { items, pagination, summary }.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { historialPagos } from '~/server/academy/pagos';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    const p = request.nextUrl.searchParams;
    const fecha = (v: string | null) =>
      v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
    return NextResponse.json(
      await historialPagos(academia.id, {
        q: p.get('q') ?? undefined,
        verificado: p.get('verified') ?? undefined,
        desde: fecha(p.get('from')),
        hasta: fecha(p.get('to')),
        metodo: p.get('method') ?? undefined,
        concepto: p.get('concepto') ?? undefined,
        page: Number(p.get('page')) || 1,
        pageSize: Number(p.get('pageSize')) || 10,
      })
    );
  } catch (error) {
    return respuestaDeError(error, 'finanzas: historial');
  }
}
