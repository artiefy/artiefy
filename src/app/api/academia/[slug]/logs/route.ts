/**
 * GET /api/academia/[slug]/logs  (super-admin de esa academia)
 *
 * Últimas 300 acciones registradas en la academia.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { listarLogs } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    return NextResponse.json({ logs: await listarLogs(academia.id) });
  } catch (error) {
    return respuestaDeError(error, 'logs: listar');
  }
}
