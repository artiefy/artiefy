import { NextResponse } from 'next/server';

import { getTicketsByUserId } from '~/models/educatorsModels/ticketsModels';
import { authorizeOwnerOrStaff } from '~/server/utils/apiAuth';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    // Security best practice: a user may only read their own tickets; staff may
    // read any (support panel).
    const authz = await authorizeOwnerOrStaff(userId);
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado' },
        { status: authz.status }
      );
    }

    const tickets = await getTicketsByUserId(userId);

    if (!tickets) {
      return NextResponse.json(
        { error: 'Tickets no encontrados para este usuario' },
        { status: 404 }
      );
    }

    return NextResponse.json(tickets);
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener los tickets' },
      { status: 500 }
    );
  }
}
