/**
 * /api/academia/[slug]/tickets/[id]  (super-admin de esa academia)
 *
 * GET   — mensajes del ticket.
 * POST  — { content } agrega un mensaje de la academia.
 * PATCH — { estado: 'cerrado' | 'abierto' } la academia cierra o reabre.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { ErrorAcademia } from '~/server/academy/academias';
import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  cambiarEstadoTicket,
  comentar,
  comentariosDe,
  ticketDe,
} from '~/server/academy/tickets';

type Ctx = { params: Promise<{ slug: string; id: string }> };

const resolver = async (params: Ctx['params']) => {
  const { slug, id } = await params;
  const { academia, cuenta } = await cuentaDeAcademia(slug, ['super-admin']);
  const ticket = await ticketDe(Number(id), academia.id);
  return { academia, cuenta, ticket };
};

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { ticket } = await resolver(params);
    return NextResponse.json({ comentarios: await comentariosDe(ticket.id) });
  } catch (error) {
    return respuestaDeError(error, 'tickets: mensajes');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { cuenta, ticket } = await resolver(params);
    const body = (await request.json().catch(() => ({}))) as {
      content?: unknown;
    };
    await comentar(ticket.id, cuenta.userId, 'academia', body.content);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'tickets: comentar');
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { ticket } = await resolver(params);
    const body = (await request.json().catch(() => ({}))) as {
      estado?: unknown;
    };
    if (body.estado !== 'cerrado' && body.estado !== 'abierto') {
      throw new ErrorAcademia('La academia solo puede cerrar o reabrir.');
    }
    await cambiarEstadoTicket(ticket.id, body.estado);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'tickets: estado');
  }
}
