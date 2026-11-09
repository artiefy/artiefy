/**
 * /api/academia/[slug]/tickets  (super-admin de esa academia)
 *
 * GET  — tickets de la academia.
 * POST — { title, description, tipo } crea un ticket para el soporte.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { registrarLog } from '~/server/academy/logs';
import { crearTicket, listarTickets } from '~/server/academy/tickets';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    return NextResponse.json({ tickets: await listarTickets(academia.id) });
  } catch (error) {
    return respuestaDeError(error, 'tickets: listar');
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
    const nuevo = await crearTicket(
      academia.id,
      { userId: cuenta.userId, email: cuenta.email },
      body
    );
    await registrarLog(academia.id, 'Ticket creado', String(body.title ?? ''));
    return NextResponse.json({ ok: true, ...nuevo }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error, 'tickets: crear');
  }
}
