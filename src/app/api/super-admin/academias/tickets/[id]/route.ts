/**
 * /api/super-admin/academias/tickets/[id]  (solo super-admin de Artiefy)
 *
 * GET   — mensajes del ticket.
 * POST  — { content } responde como soporte de Artiefy.
 * PATCH — { estado } cambia el estado.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  esSuperAdminArtiefy,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  cambiarEstadoTicket,
  comentar,
  comentariosDe,
  ticketDe,
} from '~/server/academy/tickets';

type Ctx = { params: Promise<{ id: string }> };

const noAutorizado = () =>
  NextResponse.json({ error: 'No autorizado' }, { status: 401 });

export async function GET(_request: NextRequest, { params }: Ctx) {
  if (!(await esSuperAdminArtiefy())) return noAutorizado();
  try {
    const ticket = await ticketDe(Number((await params).id));
    return NextResponse.json({ comentarios: await comentariosDe(ticket.id) });
  } catch (error) {
    return respuestaDeError(error, 'tickets academias: mensajes');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const userId = await esSuperAdminArtiefy();
  if (!userId) return noAutorizado();
  try {
    const ticket = await ticketDe(Number((await params).id));
    const body = (await request.json().catch(() => ({}))) as {
      content?: unknown;
    };
    await comentar(ticket.id, userId, 'artiefy', body.content);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'tickets academias: comentar');
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  if (!(await esSuperAdminArtiefy())) return noAutorizado();
  try {
    const ticket = await ticketDe(Number((await params).id));
    const body = (await request.json().catch(() => ({}))) as {
      estado?: unknown;
    };
    await cambiarEstadoTicket(ticket.id, body.estado);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'tickets academias: estado');
  }
}
