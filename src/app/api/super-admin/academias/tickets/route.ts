/**
 * GET /api/super-admin/academias/tickets  (solo super-admin de Artiefy)
 *
 * Tickets de todas las academias.
 */

import { NextResponse } from 'next/server';

import {
  esSuperAdminArtiefy,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { listarTickets } from '~/server/academy/tickets';

export async function GET() {
  if (!(await esSuperAdminArtiefy())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    return NextResponse.json({ tickets: await listarTickets(null) });
  } catch (error) {
    return respuestaDeError(error, 'tickets academias: listar');
  }
}
