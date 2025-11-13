import { NextResponse } from 'next/server';

import { currentUser } from '@clerk/nextjs/server';
import { and, eq, or } from 'drizzle-orm';

import { db } from '~/server/db';
import { ticketComments, tickets } from '~/server/db/schema';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const ticketId = Number(id);
    if (isNaN(ticketId))
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });

    // Verificar que el ticket pertenece al usuario
    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, ticketId),
    });
    if (!ticket)
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    if (ticket.creatorId !== user.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Marcar como leídos todos los mensajes de soporte/administración para este ticket
    await db
      .update(ticketComments)
      .set({ isRead: true })
      .where(
        and(
          eq(ticketComments.ticketId, ticketId),
          // Marcar mensajes de admin O support (no del usuario)
          or(
            eq(ticketComments.sender, 'admin'),
            eq(ticketComments.sender, 'support')
          ),
          eq(ticketComments.isRead, false)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking ticket messages as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
